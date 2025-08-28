-- Habilita a extensão uuid-ossp para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de perfis
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  bio TEXT,
  location TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id)
);

-- Tabela de filmes
CREATE TABLE movies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tmdb_id INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL,
  poster_path TEXT,
  release_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  movie_id UUID REFERENCES movies(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 0 AND rating <= 5),
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, movie_id)
);

-- Tabela de watchlist
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  movie_id UUID REFERENCES movies(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, movie_id)
);

-- Função para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Políticas de segurança RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Usuários podem ver todos os perfis públicos"
  ON users FOR SELECT
  USING (true);

-- Políticas para profiles
CREATE POLICY "Usuários podem ver todos os perfis"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem editar apenas seu próprio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios perfis"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas para movies
CREATE POLICY "Qualquer um pode ver filmes"
  ON movies FOR SELECT
  USING (true);

-- Políticas para reviews
CREATE POLICY "Qualquer um pode ver reviews"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem criar suas próprias reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar suas próprias reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para watchlist
CREATE POLICY "Usuários podem ver suas próprias watchlists"
  ON watchlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem gerenciar suas próprias watchlists"
  ON watchlist FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios dados"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id); 