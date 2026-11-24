import type { SeedProblem } from "../../../seed-problems";
import { CONTAINERS_GUIDED_PROBLEMS } from "./topic-containers-guided";
import { CONTAINERS_EXTRA_PROBLEMS } from "./topic-containers-extra";
import { COMPOSE_GUIDED_PROBLEMS } from "./topic-compose-guided";
import { COMPOSE_EXTRA_PROBLEMS } from "./topic-compose-extra";
import { PIPELINES_GUIDED_PROBLEMS } from "./topic-pipelines-guided";
import { PIPELINES_MATRIX_PROBLEMS } from "./topic-pipelines-matrix";
import { PIPELINES_EXTRA_PROBLEMS } from "./topic-pipelines-extra";
import { CHECKPOINT_PIPELINE_PROBLEMS } from "./checkpoint-pipeline";
import { CHECKPOINT_IMAGE_PROBLEMS } from "./checkpoint-image";
import { CHECKPOINT_INCIDENT_PROBLEMS } from "./checkpoint-incident";

export const DOCKER_CICD_PROBLEMS: SeedProblem[] = [
  ...CONTAINERS_GUIDED_PROBLEMS,
  ...CONTAINERS_EXTRA_PROBLEMS,
  ...COMPOSE_GUIDED_PROBLEMS,
  ...COMPOSE_EXTRA_PROBLEMS,
  ...PIPELINES_GUIDED_PROBLEMS,
  ...PIPELINES_MATRIX_PROBLEMS,
  ...PIPELINES_EXTRA_PROBLEMS,
  ...CHECKPOINT_PIPELINE_PROBLEMS,
  ...CHECKPOINT_IMAGE_PROBLEMS,
  ...CHECKPOINT_INCIDENT_PROBLEMS,
];
