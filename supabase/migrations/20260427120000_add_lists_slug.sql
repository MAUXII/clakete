-- Slug só a partir do título (sem id). Acentos removidos via extensão unaccent (sem translate() quebrado).
-- Colisão no mesmo usuário → -1, -2, …
--
-- Bug antigo: translate(from, to) com |from| ≠ |to| deslocava mapeamentos; um "i" ASCII a mais no "from"
-- fazia todo "i" virar "o" (ex.: Plotwist → plotwost).

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

ALTER TABLE public.lists ADD COLUMN IF NOT EXISTS slug TEXT;

DROP INDEX IF EXISTS public.lists_user_id_slug_key;

UPDATE public.lists SET slug = NULL;

CREATE OR REPLACE FUNCTION public._slugify_list_title(p_title text)
RETURNS text
LANGUAGE sql
STABLE
AS $f$
  SELECT left(
    trim(
      both '-'
      from regexp_replace(
        regexp_replace(
          lower(
            extensions.unaccent(
              coalesce(nullif(trim(p_title), ''), 'lista')
            )
          ),
          '[^a-z0-9]+',
          '-',
          'g'
        ),
        '-+',
        '-',
        'g'
      )
    ),
    80
  );
$f$;

DO $$
DECLARE
  r RECORD;
  v_base text;
  v_slug text;
  v_n int;
  v_guard int := 0;
BEGIN
  FOR r IN
    SELECT id, user_id, title
    FROM public.lists
    ORDER BY user_id, id
  LOOP
    v_base := public._slugify_list_title(r.title);
    v_slug := v_base;
    v_n := 0;
    v_guard := 0;

    LOOP
      EXIT WHEN NOT EXISTS (
        SELECT 1
        FROM public.lists x
        WHERE x.user_id = r.user_id
          AND x.slug = v_slug
          AND x.id <> r.id
      );

      v_n := v_n + 1;
      v_slug := v_base || '-' || v_n::text;
      v_guard := v_guard + 1;
      IF v_guard > 10000 THEN
        RAISE EXCEPTION 'lists slug: excesso de colisões para list id %', r.id;
      END IF;
    END LOOP;

    UPDATE public.lists SET slug = v_slug WHERE id = r.id;
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS public._slugify_list_title(text);

CREATE UNIQUE INDEX IF NOT EXISTS lists_user_id_slug_key ON public.lists (user_id, slug);
