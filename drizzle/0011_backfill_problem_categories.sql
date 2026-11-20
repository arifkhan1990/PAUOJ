WITH ranked_tags AS (
  SELECT
    problem_tags.problem_id,
    tags.name,
    row_number() OVER (PARTITION BY problem_tags.problem_id ORDER BY tags.name) AS position
  FROM problem_tags
  INNER JOIN tags ON tags.id = problem_tags.tag_id
)
UPDATE problems
SET
  category = COALESCE(problems.category, (
    SELECT ranked_tags.name FROM ranked_tags
    WHERE ranked_tags.problem_id = problems.id AND ranked_tags.position = 1
  )),
  subcategory = COALESCE(problems.subcategory, (
    SELECT ranked_tags.name FROM ranked_tags
    WHERE ranked_tags.problem_id = problems.id AND ranked_tags.position = 2
  ));
