-- Schema para RadioPad - Supabase
-- Ejecutar este script en el SQL Editor de Supabase

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('chief', 'operator', 'host')),
  assigned_program_ids BIGINT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda rápida por username
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Tabla de programas
CREATE TABLE IF NOT EXISTS programs (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de sonidos
-- scope: 'institutional' (globales para todos), 'program' (específicos de programa), 
--        'personal' (personales de usuario), 'effect' (efectos globales)
-- file_url: ruta local del archivo de audio
-- duration_seconds: duración calculada automáticamente
-- categories: array de etiquetas como ['musica', 'comedia', 'noticia']
CREATE TABLE IF NOT EXISTS sounds (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('institutional', 'program', 'personal', 'effect')),
  program_id BIGINT REFERENCES programs(id) ON DELETE CASCADE,
  owner_user_id BIGINT,
  file_url TEXT NOT NULL,
  play_count INTEGER DEFAULT 0,
  duration_seconds NUMERIC,
  categories TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_sounds_scope ON sounds(scope);
CREATE INDEX IF NOT EXISTS idx_sounds_program_id ON sounds(program_id);
CREATE INDEX IF NOT EXISTS idx_sounds_owner_user_id ON sounds(owner_user_id);

-- Políticas RLS (Row Level Security)
-- IMPORTANTE: Habilitar RLS en las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sounds ENABLE ROW LEVEL SECURITY;

-- Políticas para users: permitir acceso público (anon y authenticated)
DROP POLICY IF EXISTS "Allow read access to users" ON users;
CREATE POLICY "Allow read access to users" 
  ON users FOR SELECT 
  TO public 
  USING (true);

DROP POLICY IF EXISTS "Allow insert access to users" ON users;
CREATE POLICY "Allow insert access to users" 
  ON users FOR INSERT 
  TO public 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update access to users" ON users;
CREATE POLICY "Allow update access to users" 
  ON users FOR UPDATE 
  TO public 
  USING (true);

DROP POLICY IF EXISTS "Allow delete access to users" ON users;
CREATE POLICY "Allow delete access to users" 
  ON users FOR DELETE 
  TO public 
  USING (true);

-- Política para programs: permitir lectura a todos los usuarios autenticados
DROP POLICY IF EXISTS "Allow read access to programs" ON programs;
CREATE POLICY "Allow read access to programs" 
  ON programs FOR SELECT 
  TO authenticated 
  USING (true);

-- Política para programs: permitir inserción a usuarios autenticados
DROP POLICY IF EXISTS "Allow insert access to programs" ON programs;
CREATE POLICY "Allow insert access to programs" 
  ON programs FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Política para programs: permitir actualización a usuarios autenticados
DROP POLICY IF EXISTS "Allow update access to programs" ON programs;
CREATE POLICY "Allow update access to programs" 
  ON programs FOR UPDATE 
  TO authenticated 
  USING (true);

-- Política para programs: permitir eliminación a usuarios autenticados
DROP POLICY IF EXISTS "Allow delete access to programs" ON programs;
CREATE POLICY "Allow delete access to programs" 
  ON programs FOR DELETE 
  TO authenticated 
  USING (true);

-- Política para sounds: permitir lectura a todos los usuarios autenticados
DROP POLICY IF EXISTS "Allow read access to sounds" ON sounds;
CREATE POLICY "Allow read access to sounds" 
  ON sounds FOR SELECT 
  TO authenticated 
  USING (true);

-- Política para sounds: permitir inserción a usuarios autenticados
DROP POLICY IF EXISTS "Allow insert access to sounds" ON sounds;
CREATE POLICY "Allow insert access to sounds" 
  ON sounds FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Política para sounds: permitir actualización a usuarios autenticados
DROP POLICY IF EXISTS "Allow update access to sounds" ON sounds;
CREATE POLICY "Allow update access to sounds" 
  ON sounds FOR UPDATE 
  TO authenticated 
  USING (true);

-- Política para sounds: permitir eliminación a usuarios autenticados
DROP POLICY IF EXISTS "Allow delete access to sounds" ON sounds;
CREATE POLICY "Allow delete access to sounds" 
  ON sounds FOR DELETE 
  TO authenticated 
  USING (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_programs_updated_at ON programs;
CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sounds_updated_at ON sounds;
CREATE TRIGGER update_sounds_updated_at
  BEFORE UPDATE ON sounds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
