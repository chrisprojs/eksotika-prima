-- Store localized text as JSON in the existing text columns.
-- Indonesian text uses the "id" key. English text uses the "en" key.
-- Product.produsen stays plain text and is not localized.
-- Example value: {"id":"Minyak Cap Tawon", "en":"Tawon Oil"}

UPDATE "Product"
SET
    "title" = CASE
        WHEN json_valid("title") THEN CASE WHEN json_type("title") = 'object' THEN "title" ELSE json_object('id', "title") END
        ELSE json_object('id', "title")
    END,
    "merk" = CASE
        WHEN json_valid("merk") THEN CASE WHEN json_type("merk") = 'object' THEN "merk" ELSE json_object('id', "merk") END
        ELSE json_object('id', "merk")
    END,
    "detail" = CASE
        WHEN json_valid("detail") THEN CASE WHEN json_type("detail") = 'object' THEN "detail" ELSE json_object('id', "detail") END
        ELSE json_object('id', "detail")
    END;

UPDATE "News"
SET
    "slug" = CASE
        WHEN json_valid("slug") THEN CASE WHEN json_type("slug") = 'object' THEN "slug" ELSE json_object('id', "slug") END
        ELSE json_object('id', "slug")
    END,
    "title" = CASE
        WHEN json_valid("title") THEN CASE WHEN json_type("title") = 'object' THEN "title" ELSE json_object('id', "title") END
        ELSE json_object('id', "title")
    END,
    "summary" = CASE
        WHEN json_valid("summary") THEN CASE WHEN json_type("summary") = 'object' THEN "summary" ELSE json_object('id', "summary") END
        ELSE json_object('id', "summary")
    END,
    "contentHtml" = CASE
        WHEN json_valid("contentHtml") THEN CASE WHEN json_type("contentHtml") = 'object' THEN "contentHtml" ELSE json_object('id', "contentHtml") END
        ELSE json_object('id', "contentHtml")
    END;