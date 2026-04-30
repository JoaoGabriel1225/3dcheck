-- 3DCheck Supabase Schema
-- Instruções: Execute este script no SQL Editor do Supabase.

-- Habilitar a extensão UUID (geralmente habilitada por padrão)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela: user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user'))
);

-- 2. Tabela: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'pending', 'active', 'blocked')),
    "trialEndsAt" TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para criar profile e user_role automaticamente após sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    -- Verifica se é o admin automático
    is_admin := (NEW.email = 'joaogabrielpires11@gmail.com');
    
    INSERT INTO public.profiles (id, name, email, role, status, "trialEndsAt")
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.email,
        CASE WHEN is_admin THEN 'admin' ELSE 'user' END,
        CASE WHEN is_admin THEN 'active' ELSE 'trial' END,
        CASE WHEN is_admin THEN NULL ELSE NOW() + INTERVAL '7 days' END
    );
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
        NEW.id,
        CASE WHEN is_admin THEN 'admin' ELSE 'user' END
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Tabela: store_settings (Customização do Storefront)
CREATE TABLE IF NOT EXISTS public.store_settings (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    store_name TEXT,
    logo_url TEXT,
    banner_url TEXT,
    primary_color TEXT DEFAULT '#1E3A8A',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cria store_settings padrão ao criar profile
CREATE OR REPLACE FUNCTION public.handle_new_profile_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.store_settings (user_id, store_name, description)
    VALUES (NEW.id, NEW.name || ' Store', 'Bem-vindo à nossa loja de impressão 3D!');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_settings();

-- 4. Tabela: clients
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela: products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    final_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    cost_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    profit_margin NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(10, 2) DEFAULT 0,
    main_image_url TEXT,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela: product_images
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabela: orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    product_id UUID references public.products(id) ON DELETE SET NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Aguardando contato' CHECK (status IN ('Aguardando contato', 'Confirmado', 'Preparação', 'Pronto', 'Enviado', 'Cancelado')),
    final_price NUMERIC(10, 2),
    cost_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    deadline_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabela: payment_requests
CREATE TABLE IF NOT EXISTS public.payment_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pix_proof_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
-- Profiles: usuario ve o seu, admin ve todos
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Store Settings: publico ver (SELECT), usuario atualiza o seu
DROP POLICY IF EXISTS "Anyone can view store settings" ON public.store_settings;
CREATE POLICY "Anyone can view store settings" ON public.store_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can edit own store settings" ON public.store_settings;
CREATE POLICY "Users can edit own store settings" ON public.store_settings FOR ALL USING (user_id = auth.uid());

-- Clients: admin ve todos, usuario ve os seus. Storefront (anonimo/publico) pode inserir client se souber user_id (para poder criar pedido do storefront)
DROP POLICY IF EXISTS "Admins view all clients" ON public.clients;
CREATE POLICY "Admins view all clients" ON public.clients FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users view own clients" ON public.clients;
CREATE POLICY "Users view own clients" ON public.clients FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users modify own clients" ON public.clients;
CREATE POLICY "Users modify own clients" ON public.clients FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can insert clients (storefront)" ON public.clients;
CREATE POLICY "Anyone can insert clients (storefront)" ON public.clients FOR INSERT WITH CHECK (true);

-- Products: admin ve todos, usuario modifica os seus. Publico ve produtos com is_public=true
DROP POLICY IF EXISTS "Anyone view public products" ON public.products;
CREATE POLICY "Anyone view public products" ON public.products FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Users view own products" ON public.products;
CREATE POLICY "Users view own products" ON public.products FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins view all products" ON public.products;
CREATE POLICY "Admins view all products" ON public.products FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users modify own products" ON public.products;
DROP POLICY IF EXISTS "Users insert own products" ON public.products;
DROP POLICY IF EXISTS "Users update own products" ON public.products;
DROP POLICY IF EXISTS "Users delete own products" ON public.products;

CREATE POLICY "Users insert own products" ON public.products FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own products" ON public.products FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users delete own products" ON public.products FOR DELETE USING (user_id = auth.uid());

-- Product Images: publico ver (se produto visível), usuario edita as suas
DROP POLICY IF EXISTS "Anyone view product images" ON public.product_images;
CREATE POLICY "Anyone view product images" ON public.product_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users modify own product images" ON public.product_images;
CREATE POLICY "Users modify own product images" ON public.product_images FOR ALL USING (
    EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND user_id = auth.uid())
);

-- Orders: admin ve e modifica tudo, usuario so as suas. Anonimo pode inserir (Storefront).
DROP POLICY IF EXISTS "Admins view all orders" ON public.orders;
CREATE POLICY "Admins view all orders" ON public.orders FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins modify all orders" ON public.orders;
CREATE POLICY "Admins modify all orders" ON public.orders FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users modify own orders" ON public.orders;
CREATE POLICY "Users modify own orders" ON public.orders FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can insert orders (storefront)" ON public.orders;
CREATE POLICY "Anyone can insert orders (storefront)" ON public.orders FOR INSERT WITH CHECK (true);

-- Payment Requests: admin ve e aprova, usuario ve e insere os seus
DROP POLICY IF EXISTS "Admins view/update payment requests" ON public.payment_requests;
CREATE POLICY "Admins view/update payment requests" ON public.payment_requests FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users view own payment requests" ON public.payment_requests;
CREATE POLICY "Users view own payment requests" ON public.payment_requests FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert own payment requests" ON public.payment_requests;
CREATE POLICY "Users insert own payment requests" ON public.payment_requests FOR INSERT WITH CHECK (user_id = auth.uid());

-- Inserir os buckets de storage:
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('pix-proofs', 'pix-proofs', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('store-assets', 'store-assets', true) ON CONFLICT DO NOTHING;

-- ALTER TABLE commands for updates
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_total NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS profit_margin NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS main_image_url TEXT;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cost_total NUMERIC(10, 2) NOT NULL DEFAULT 0;


-- Storage Policies: allow insert for authenticated users, allow read based on bucket config
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images" ON storage.objects FOR SELECT USING (bucket_id IN ('product-images', 'store-assets'));

DROP POLICY IF EXISTS "Authenticated user insert objects" ON storage.objects;
CREATE POLICY "Authenticated user insert objects" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('product-images', 'pix-proofs', 'store-assets'));

DROP POLICY IF EXISTS "Admins can view pix-proofs" ON storage.objects;
CREATE POLICY "Admins can view pix-proofs" ON storage.objects FOR SELECT USING (
    bucket_id = 'pix-proofs' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "User can view own pix-proofs" ON storage.objects;
CREATE POLICY "User can view own pix-proofs" ON storage.objects FOR SELECT TO authenticated USING (
    bucket_id = 'pix-proofs' AND auth.uid() = owner
);

-- Create some default test user info if necessary
-- Note: do not forget to replace user credentials manually
