-- =====================================================================
-- PROJETO NEXUS - BANCO DE DADOS PRINCIPAL (CORRIGIDO)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS NEXUS;
USE NEXUS;

-- 1. Tabela de Clientes
CREATE TABLE clientes (
    id_cliente INT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL, 
    telefone VARCHAR(20),
    cpf VARCHAR(14) UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    endereco VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ativo'
);

-- 2. Tabela de Produtos/Estoque
CREATE TABLE produto (
    id_produto INT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tamanho VARCHAR(10),
    cor VARCHAR(30),
    preco DECIMAL(10,2),
    estoque INT NOT NULL DEFAULT 0
);

-- 3. Tabela de Vendas (Adicionado AUTO_INCREMENT para evitar erros de ID)
CCREATE TABLE item_venda (
  CREATE TABLE item_venda (
    id_item_venda INT AUTO_INCREMENT PRIMARY KEY,
    id_venda INT,
    id_produto INT,
    quantidade INT NOT NULL,
    CONSTRAINT fk_item_venda FOREIGN KEY (id_venda) REFERENCES venda(id_venda),
    CONSTRAINT fk_item_produto FOREIGN KEY (id_produto) REFERENCES produto(id_produto)
);x'


-- 4. Tabela de Itens Vendidos
CREATE TABLE item_venda (
    id_item_venda INT PRIMARY KEY,
    id_venda INT,
    id_produto INT,
    quantidade INT NOT NULL,
    CONSTRAINT fk_item_venda FOREIGN KEY (id_venda) REFERENCES venda(id_venda),
    CONSTRAINT fk_item_produto FOREIGN KEY (id_produto) REFERENCES produto(id_produto)
);

-- 5. Tabela de Categorias
CREATE TABLE categoria (
    id_categoria INT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL
);

-- 6. Tabela que associa os produtos às categorias
CREATE TABLE produto_categoria (
    id_produto INT, 
    id_categoria INT, 
    CONSTRAINT fk_pc_produto FOREIGN KEY (id_produto) REFERENCES produto(id_produto),
    CONSTRAINT fk_pc_categoria FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria)
);

-- 7. Tabela de Funcionários
CREATE TABLE funcionarios (
    id_funcionario INT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(20),
    cpf VARCHAR(14) UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    endereco VARCHAR(255),
    cargo VARCHAR(50)
);

-- =====================================================================
-- INSERÇÃO DE DADOS INICIAIS (CLIENTES)
-- =====================================================================

INSERT INTO clientes (id_cliente, nome, telefone, cpf, email, endereco, status) VALUES 
(1, 'João Silva', '(11)99476-1582', '123.456.789-00', 'joao.silva@email.com', 'rua inglatera, 123 São Paulo', 'ativo'),
(2, 'Maria Souza', '(21)98765-4321', '987.654.321-00', 'marizinhasoso@gmail.com', 'rua sem entrada, 1533 - Rio de janeiro', 'inativo'),
(3, 'denis silva', '(18)99845-4432', '111.222.333-44', 'bigodedeboi@gmail.com', 'rua do bigode, 123 - Andradina', 'ativo'),
(4, 'Juliana Mendes', '(11) 95544-3322', '222.333.444-55', 'juliana@email.com', 'Rua Augusta, 100 - São Paulo', 'Ativo'),
(5, 'Lucas Pereira', '(11) 94433-2211', '555.666.777-88', 'lucas@email.com', 'Av. Paulista, 500 - São Paulo', 'Ativo'),
(6, 'Beatriz Lima', '(11) 93322-1100', '999.888.777-66', 'beatriz@email.com', 'Praça da Sé, 50 - São Paulo', 'Inativo'),
(7, 'Rafael Costa', '(11) 92211-0099', '444.555.666-77', 'rafa@gmail.com', 'Rua das Flores, 200 - São Paulo', 'Ativo'),
(8, 'Fernanda Rocha', '(11) 91100-9988', '888.777.666-55', 'fernanda.rocha@nexus.com.br', 'Av. Paulista, 800 - São Paulo', 'Ativo');

-- =====================================================================
-- INSERÇÃO DE DADOS DE FUNCIONARIOS 
-- =====================================================================

INSERT INTO funcionarios (id_funcionario, nome, telefone, cpf, email, endereco, cargo) VALUES 
(1, 'Joao Pedro', '(11) 94760-6590', '412.385.961-82', 'joao.pedro@nexus.com.br', 'Rua Principal, 100 - São Paulo', 'Back-end'),
(2, 'Jorge Lobato', '(11) 98747-6595', '785.412.963-10', 'jorge.lobato@nexus.com.br', 'Av. Central, 200 - São Paulo', 'Back-end'),
(3, 'Kelvin Soares', '(11)99476-1582', '382.910.458-12', 'kelvinsoares@nexus.com.br', 'Av. Celso Garcia, 1200 - São Paulo', 'Coordenador TI'),
(4, 'Isabelly Alves', '(11)98780-3237', '123.456.789-09', 'isabellyalves@nexus.com.br', 'Rua Augusta, 1500 - São Paulo', 'Recursos Humanos'),             
(5, 'Jessica Barbosa', '(11)97114-1403', '592.947.017-38', 'jessicabiano@nexus.com.br', 'Rodolfo Pirane, 850 - São Paulo', 'Desenvolvedora de sistemas'),
(6, 'Caua Cordeschi', '(11)94904-2078', '554.787.554-32', 'cordeschi.caua@nexus.com.br', 'Rua Bom Jesus, 654 - São Paulo', 'Suporte Técnico'),
(7, 'Rafael Rodrigues', '(11)99291-6643', '238.299.535-47', 'rafael.rp@nexus.com.br', 'Rua Apiácas, 826 - São Paulo', 'Back-end'),
(8, 'Adriano de Souza', '(11)91328-0747', '153.312.124-41', 'adriano.candido@nexus.com.br', 'Rua Cajuru, 878 - São Paulo', 'Banco de dados'),
(9, 'Allan Sandes', '(11)97522-2318', '765.623.912-66', 'allansandes@nexus.com.br', 'Rua dos Jacintos, 87 - São Paulo', 'Analista de Processos e Documentação'),
(10, 'Guilherme Luz', '(11)97387-2799', '591.196.038-05', 'guilherme.luz@nexus.com.br', 'Rua Paulino Alves Escudeiro, 151 - São Paulo', 'Analista de Processos e Documentação');

-- =====================================================================
-- Tabela de Produtos/Estoque 
-- =====================================================================

INSERT INTO produto (id_produto, nome, tamanho, cor, preco, estoque) VALUES 
(1, 'Camiseta Neymar Street', 'M', 'Preta', 79.90, 100),
(2, 'Camiseta Neymar Street', 'G', 'Preta', 79.90, 100),
(3, 'Camiseta Neymar Street', 'GG', 'Preta', 79.90, 100),
(4, 'Camiseta Neymar Street', 'M', 'Branca', 79.90, 100),
(5, 'Camiseta Neymar Street', 'G', 'Branca', 79.90, 100),
(6, 'Camiseta Neymar Street', 'GG', 'Branca', 79.90, 100);