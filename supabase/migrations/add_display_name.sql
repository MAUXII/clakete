-- Adiciona a coluna display_name na tabela users
ALTER TABLE users ADD COLUMN display_name TEXT;

-- Atualiza os display_names existentes para serem iguais ao username
UPDATE users SET display_name = username WHERE display_name IS NULL;

-- Adiciona uma trigger para definir display_name como username por padrão
CREATE OR REPLACE FUNCTION set_default_display_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.display_name IS NULL THEN
    NEW.display_name := NEW.username;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_display_name_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_default_display_name();
