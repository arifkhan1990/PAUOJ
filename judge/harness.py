#!/usr/bin/env python3
"""Sandbox-internal test harness.

Runs as root inside a locked-down container. Every child process is dropped to
the nobody user, gets its own session and strict resource limits. Test files and
results live outside the child's writable area, so submitted code cannot tamper
with them.
"""

import argparse
import json
import os
import resource
import signal
import subprocess
import sys
import time
from pathlib import Path

NOBODY_UID = 65534
NOBODY_GID = 65534
OUTPUT_LIMIT_BYTES = 2 * 1024 * 1024
STDERR_PREVIEW_BYTES = 2048


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--language", required=True)
    parser.add_argument("--time-limit-ms", type=int, required=True)
    parser.add_argument("--memory-limit-mb", type=int, required=True)
    parser.add_argument("--tests", type=int, required=True)
    parser.add_argument("--mode", choices=["submission", "run"], required=True)
    parser.add_argument(
        "--checker",
        choices=["exact", "token", "float", "custom"],
        default="exact",
    )
    parser.add_argument("--float-tolerance", type=float, default=1e-6)
    parser.add_argument("--checker-script", default="")
    parser.add_argument("--test-dir", required=True)
    parser.add_argument("--expected-dir", required=True)
    parser.add_argument("--work-dir", required=True)
    parser.add_argument("--results", required=True)
    parser.add_argument("--output-dir", required=True)
    return parser.parse_args()


def command_for(args: argparse.Namespace) -> list[str]:
    work = args.work_dir
    if args.language in ("c", "cpp"):
        return [os.path.join(work, "main")]
    if args.language == "python":
        return ["python3", "-B", os.path.join(work, "main.py")]
    if args.language == "javascript":
        return ["node", os.path.join(work, "main.js")]
    if args.language == "java":
        heap = max(64, args.memory_limit_mb - 128)
        return [
            "java",
            f"-Xmx{heap}m",
            "-Xss64m",
            "-XX:+UseSerialGC",
            "-XX:ActiveProcessorCount=1",
            "-Djava.io.tmpdir=/tmp",
            "-cp",
            work,
            "Main",
        ]
    if args.language == "kotlin":
        heap = max(64, args.memory_limit_mb - 128)
        return [
            "java",
            f"-Xmx{heap}m",
            "-Xss64m",
            "-XX:+UseSerialGC",
            "-XX:ActiveProcessorCount=1",
            "-Djava.io.tmpdir=/tmp",
            "-jar",
            os.path.join(work, "main.jar"),
        ]
    if args.language == "csharp":
        return ["mono", os.path.join(work, "main.exe")]
    if args.language in ("go", "swift"):
        return [os.path.join(work, "main")]
    if args.language == "php":
        return ["php", os.path.join(work, "main.php")]
    if args.language in ("sql", "sqlite", "mysql", "postgresql"):
        command = [
            "python3",
            "-B",
            "/sql-runner.py",
            os.path.join(work, "main.sql"),
            args.language,
        ]
        if os.environ.get("SQL_SCRIPT") == "1":
            command.append("--script")
        return command
    raise SystemExit(f"unsupported language: {args.language}")


def child_limits() -> None:
    os.setsid()
    os.setgroups([])
    os.setgid(NOBODY_GID)
    os.setuid(NOBODY_UID)
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
    resource.setrlimit(resource.RLIMIT_FSIZE, (OUTPUT_LIMIT_BYTES, OUTPUT_LIMIT_BYTES))
    resource.setrlimit(resource.RLIMIT_NOFILE, (64, 64))
    resource.setrlimit(resource.RLIMIT_NPROC, (64, 64))
    resource.setrlimit(resource.RLIMIT_STACK, (64 * 1024 * 1024, 64 * 1024 * 1024))


def normalize(raw: bytes) -> str:
    text = raw.decode("utf-8", errors="replace")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = [line.rstrip() for line in text.split("\n")]
    while lines and lines[-1] == "":
        lines.pop()
    return "\n".join(lines)


def read_capped(path: Path, limit: int = OUTPUT_LIMIT_BYTES) -> tuple[bytes, bool]:
    try:
        with path.open("rb") as handle:
            data = handle.read(limit + 1)
        return data, len(data) >= limit
    except FileNotFoundError:
        return b"", False


def write_results(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle)
        handle.flush()
        os.fsync(handle.fileno())


def check_output(
    args: argparse.Namespace,
    input_path: Path,
    expected_path: Path,
    stdout_path: Path,
    output: str,
    expected: str,
) -> tuple[bool, str | None]:
    if args.checker == "exact":
        return output == expected, None
    if args.checker == "token":
        actual_tokens = output.split()
        expected_tokens = expected.split()
        if actual_tokens == expected_tokens:
            return True, None
        return False, "Output tokens do not match the expected answer."
    if args.checker == "float":
        try:
            actual_values = [float(token) for token in output.split()]
            expected_values = [float(token) for token in expected.split()]
        except ValueError:
            return False, "Float checker could not parse the output."
        if len(actual_values) != len(expected_values):
            return False, "Output has a different number of values."
        for actual, wanted in zip(actual_values, expected_values):
            if abs(actual - wanted) > args.float_tolerance * max(
                1.0, abs(wanted)
            ):
                return False, "Floating-point answer is outside the tolerance."
        return True, None
    if args.checker == "custom":
        if not args.checker_script:
            return False, "Custom checker script is missing."
        env = {
            "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
            "HOME": "/tmp",
            "TMPDIR": "/tmp",
            "LANG": "C.UTF-8",
            "LC_ALL": "C.UTF-8",
        }
        try:
            process = subprocess.run(
                [
                    sys.executable,
                    args.checker_script,
                    str(input_path),
                    str(expected_path),
                    str(stdout_path),
                ],
                cwd="/tmp",
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=5,
                check=False,
            )
        except subprocess.TimeoutExpired:
            return False, "Custom checker timed out."
        message = (
            process.stderr.decode("utf-8", errors="replace").strip()
            or process.stdout.decode("utf-8", errors="replace").strip()
        )
        if process.returncode == 0:
            return True, None
        return False, message[:2048] or "Custom checker rejected the output."
    return output == expected, None


def classify(
    args: argparse.Namespace,
    timed_out: bool,
    output_overflow: bool,
    exit_code: int,
    elapsed_ms: int,
    memory_kb: int,
    output: str,
    expected: str | None,
    input_path: Path,
    expected_path: Path,
    stdout_path: Path,
) -> tuple[str, str | None]:
    if timed_out or elapsed_ms > args.time_limit_ms:
        return "TIME_LIMIT_EXCEEDED", None
    if output_overflow:
        return "OUTPUT_LIMIT_EXCEEDED", None
    if memory_kb > args.memory_limit_mb * 1024:
        return "MEMORY_LIMIT_EXCEEDED", None
    if exit_code != 0:
        return "RUNTIME_ERROR", None
    if args.mode == "run" or expected is None:
        return "ACCEPTED", None
    accepted, message = check_output(
        args, input_path, expected_path, stdout_path, output, expected
    )
    return ("ACCEPTED" if accepted else "WRONG_ANSWER"), message


def run_test(args: argparse.Namespace, position: int) -> dict:
    test_dir = Path(args.test_dir)
    input_path = test_dir / f"input-{position}.txt"
    expected_path = Path(args.expected_dir) / f"expected-{position}.txt"
    expected = normalize(expected_path.read_bytes()) if expected_path.exists() else None

    stdout_path = Path("/tmp") / f"stdout-{position}.txt"
    stderr_path = Path("/tmp") / f"stderr-{position}.txt"
    stdout_fd = os.open(stdout_path, os.O_CREAT | os.O_TRUNC | os.O_WRONLY, 0o600)
    stderr_fd = os.open(stderr_path, os.O_CREAT | os.O_TRUNC | os.O_WRONLY, 0o600)
    input_fd = os.open(input_path, os.O_RDONLY)

    env = {
        "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        "HOME": "/tmp",
        "TMPDIR": "/tmp",
        "PYTHONDONTWRITEBYTECODE": "1",
        "LANG": "C.UTF-8",
        "LC_ALL": "C.UTF-8",
    }

    timed_out = False
    elapsed_ms = 0
    exit_code = -1
    process = None
    started = time.monotonic()
    try:
        process = subprocess.Popen(
            command_for(args),
            stdin=input_fd,
            stdout=stdout_fd,
            stderr=stderr_fd,
            cwd="/tmp",
            env=env,
            preexec_fn=child_limits,
            close_fds=True,
        )
        try:
            process.wait(timeout=max(0.05, args.time_limit_ms / 1000.0))
        except subprocess.TimeoutExpired:
            timed_out = True
            try:
                os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            process.wait(timeout=5)
        exit_code = process.returncode if process.returncode is not None else -1
    finally:
        elapsed_ms = int((time.monotonic() - started) * 1000)
        os.close(input_fd)
        os.close(stdout_fd)
        os.close(stderr_fd)

    output_raw, output_overflow = read_capped(stdout_path)
    stderr_raw, stderr_overflow = read_capped(stderr_path)
    file_size_signal = getattr(signal, "SIGXFSZ", 25)
    output_overflow = (
        output_overflow
        or stderr_overflow
        or exit_code in (-file_size_signal, 128 + file_size_signal)
    )
    memory_kb = resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss

    output = normalize(output_raw)
    status, checker_message = classify(
        args,
        timed_out,
        output_overflow,
        exit_code,
        elapsed_ms,
        memory_kb,
        output,
        expected,
        input_path,
        expected_path,
        stdout_path,
    )

    stderr_text = normalize(stderr_raw)[:STDERR_PREVIEW_BYTES]
    result = {
        "position": position,
        "status": status,
        "runtimeMs": elapsed_ms,
        "memoryKb": memory_kb,
        "message": checker_message or stderr_text or None,
    }

    if args.mode == "run":
        result["stdout"] = output[:65536]
        result["stderr"] = stderr_text
        (Path(args.output_dir) / "stdout.txt").write_text(output[:65536], encoding="utf-8")
        (Path(args.output_dir) / "stderr.txt").write_text(stderr_text, encoding="utf-8")

    try:
        stdout_path.unlink()
        stderr_path.unlink()
    except FileNotFoundError:
        pass

    return result


def main() -> int:
    args = parse_args()
    results_path = Path(args.results)
    payload: dict = {"mode": args.mode, "results": [], "current": None}
    write_results(results_path, payload)

    for position in range(1, args.tests + 1):
        payload["current"] = position
        write_results(results_path, payload)
        try:
            result = run_test(args, position)
        except Exception as error:  # noqa: BLE001 - reported to the worker
            payload["error"] = f"harness error: {error}"
            write_results(results_path, payload)
            return 1
        payload["results"].append(result)
        payload["current"] = None
        write_results(results_path, payload)
        if result["status"] != "ACCEPTED":
            break

    write_results(results_path, payload)
    return 0


if __name__ == "__main__":
    sys.exit(main())
