import mysql.connector
from datetime import date
import time

def realizar_compra():
    try:
        # Conexão com o MySQL do XAMPP
        conexao = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="nexus"
        )
        cursor = conexao.cursor()

        # --- AUTOMATIZAÇÃO: INSERIR/ATUALIZAR CLIENTES PADRÃO ---
        clientes_iniciais = [
            (1, 'João Silva', '(11)99476-1582', '123.456.789-00', 'joao.silva@email.com', 'rua inglatera, 123 São Paulo', 'ativo'),
            (2, 'Maria Souza', '(21)98765-4321', '987.654.321-00', 'marizinhasoso@gmail.com', 'rua sem entrada, 1533 - Rio de janeiro', 'inativo'),
            (3, 'denis silva', '(18)99845-4432', '111.222.333-44', 'bigodedeboi@gmail.com', 'rua do bigode, 123 - Andradina', 'ativo'),
            (4, 'Juliana Mendes', '(11) 95544-3322', '222.333.444-55', 'juliana@email.com', 'Rua Augusta, 100 - São Paulo', 'Ativo'),
            (5, 'Lucas Pereira', '(11) 94433-2211', '555.666.777-88', 'lucas@email.com', 'Av. Paulista, 500 - São Paulo', 'Ativo'),
            (6, 'Beatriz Lima', '(11) 93322-1100', '999.888.777-66', 'beatriz@email.com', 'Praça da Sé, 50 - São Paulo', 'Inativo'),
            (7, 'Rafael Costa', '(11) 92211-0099', '444.555.666-77', 'rafa@gmail.com', 'Rua das Flores, 200 - São Paulo', 'Ativo'),
            (8, 'Fernanda Rocha', '(11) 91100-9988', '888.777.666-55', 'fernanda.rocha@nexus.com.br', 'Av. Paulista, 800 - São Paulo', 'Ativo')
        ]

        sql_cliente = """
            INSERT INTO clientes (id_cliente, nome, telefone, cpf, email, endereco, status) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                nome=VALUES(nome), 
                telefone=VALUES(telefone), 
                cpf=VALUES(cpf), 
                email=VALUES(email), 
                endereco=VALUES(endereco), 
                status=VALUES(status);
        """
        cursor.executemany(sql_cliente, clientes_iniciais)
        conexao.commit()
        # --------------------------------------------------------

        carrinho = []  # Lista para armazenar os itens escolhidos

        while True:
            print("\n=== PRODUTOS DISPONÍVEIS NO ESTOQUE ===")
            cursor.execute("SELECT id_produto, nome, tamanho, cor, preco, estoque FROM produto;")
            produtos = cursor.fetchall()

            for p in produtos:
                p_id, p_nome, p_tam, p_cor, p_preco, p_estoque = p
                
                if p_estoque == 0:
                    status_estoque = "[ESGOTADO]"
                elif p_estoque <= 5:
                    status_estoque = f"[ESTOQUE BAIXO: {p_estoque} un.]"
                else:
                    status_estoque = f"[Disponível: {p_estoque} un.]"

                print(f"ID: {p_id} | {p_nome} - Tam: {p_tam} - Cor: {p_cor} - Preço: R$ {p_preco:.2f} | {status_estoque}")

            print("\n--------------------------------------------------")
            print("1 - Adicionar produto ao carrinho")
            print("2 - Ver carrinho / Gerir itens")
            print("3 - Finalizar compra")
            opcao_menu = input("Escolha uma opção (1-3): ")

            if opcao_menu == "1":
                id_escolhido = int(input("Digite o ID do produto que deseja adicionar: "))
                quantidade_desejada = int(input("Digite a quantidade desejada: "))

                cursor.execute("SELECT id_produto, nome, preco, estoque FROM produto WHERE id_produto = %s", (id_escolhido,))
                produto = cursor.fetchone()

                if not produto:
                    print("\n[ERRO] Produto não encontrado!")
                else:
                    p_id, p_nome, p_preco, p_estoque = produto
                    p_preco = float(p_preco)

                    if p_estoque == 0:
                        print(f"\n[ERRO] O produto '{p_nome}' está totalmente ESGOTADO!")
                    elif p_estoque >= quantidade_desejada:
                        encontrado = False
                        for item in carrinho:
                            if item['id'] == p_id:
                                qtd_total_carrinho = item['qtd'] + quantidade_desejada
                                if p_estoque >= qtd_total_carrinho:
                                    item['qtd'] = qtd_total_carrinho
                                    print(f"\n[SUCESSO] Quantidade de '{p_nome}' atualizada no carrinho!")
                                else:
                                    print(f"\n[ERRO] A quantidade total no carrinho excede o estoque disponível ({p_estoque})!")
                                encontrado = True
                                break
                        
                        if not encontrado:
                            carrinho.append({
                                'id': p_id,
                                'nome': p_nome,
                                'preco': p_preco,
                                'qtd': quantidade_desejada
                            })
                            print(f"\n[SUCESSO] '{p_nome}' adicionado ao carrinho!")
                    else:
                        print(f"\n[ERRO] Estoque insuficiente! Disponível apenas {p_estoque} unidades.")

            elif opcao_menu == "2":
                if not carrinho:
                    print("\n[VAZIO] O seu carrinho está vazio.")
                else:
                    print("\n--- SEU CARRINHO DE COMPRAS ---")
                    subtotal_geral = 0
                    for index, item in enumerate(carrinho):
                        total_item = item['preco'] * item['qtd']
                        subtotal_geral += total_item
                        print(f"[{index + 1}] {item['nome']} | Qtd: {item['qtd']} | Preço Unit.: R$ {item['preco']:.2f} | Total: R$ {total_item:.2f}".replace(".", ","))
                    print(f"Subtotal Geral: R$ {subtotal_geral:.2f}".replace(".", ","))

                    print("\nGestão do Carrinho:")
                    print("1 - Remover um item")
                    print("2 - Esvaziar carrinho")
                    print("3 - Voltar às compras")
                    acao = input("Escolha uma ação (1-3): ")

                    if acao == "1":
                        num_item = int(input("Digite o número do item que deseja remover da lista: "))
                        if 1 <= num_item <= len(carrinho):
                            removido = carrinho.pop(num_item - 1)
                            print(f"\n[REMOVIDO] '{removido['nome']}' foi retirado do carrinho.")
                        else:
                            print("\n[ERRO] Item inválido.")
                    elif acao == "2":
                        carrinho.clear()
                        print("\n[LIMPO] O carrinho foi esvaziado.")

            elif opcao_menu == "3":
                if not carrinho:
                    print("\n[AVISO] O carrinho está vazio. Adicione itens antes de finalizar.")
                else:
                    break
            else:
                print("\n[ERRO] Opção inválida.")

        # --- FLUXO DE CHECKOUT E REGISTRO NO BANCO ---
        if carrinho:
            subtotal = sum(item['preco'] * item['qtd'] for item in carrinho)

            print(f"\n--- RESUMO FINAL DO CARRINHO ---")
            for item in carrinho:
                print(f"- {item['qtd']}x {item['nome']} (R$ {item['preco'] * item['qtd']:.2f})".replace(".", ","))
            print(f"Subtotal dos Produtos: R$ {subtotal:.2f}".replace(".", ","))

            # --- 1. OPÇÕES DE PAGAMENTO ---
            print("\n--- OPÇÕES DE PAGAMENTO ---")
            print("1 - Pix (5% de desconto)")
            print("2 - Cartão de Crédito (Até 12x, sendo 6x sem juros)")
            print("3 - Boleto Bancário")
            
            opcao_pagamento = input("Escolha a forma de pagamento (1-3): ")
            valor_com_pagamento = subtotal

            if opcao_pagamento == "1":
                valor_com_pagamento *= 0.95
                print("\n[PAGAMENTO] Pix selecionado! Desconto de 5% aplicado.")
                print(f"Valor com desconto: R$ {valor_com_pagamento:.2f}".replace(".", ","))
            elif opcao_pagamento == "2":
                print("\n--- PARCELAMENTO NO CARTÃO ---")
                print("De 1x a 6x: Sem juros")
                print("De 7x a 12x: Com juros de 1.99% ao mês")
                vezes = int(input("Digite a quantidade de parcelas (1 a 12): "))
                
                if 1 <= vezes <= 6:
                    valor_parcela = valor_com_pagamento / vezes
                    print(f"\n[PAGAMENTO] Cartão em {vezes}x de R$ {valor_parcela:.2f} (Sem juros)".replace(".", ","))
                elif 7 <= vezes <= 12:
                    taxa_juros = 0.0199
                    valor_com_pagamento_com_juros = valor_com_pagamento * ((1 + taxa_juros) ** (vezes - 6))
                    valor_parcela = valor_com_pagamento_com_juros / vezes
                    print(f"\n[PAGAMENTO] Cartão em {vezes}x de R$ {valor_parcela:.2f} (Com juros)".replace(".", ","))
                    valor_com_pagamento = valor_com_pagamento_com_juros
                else:
                    print("\n[AVISO] Número de parcelas inválido. Processando em 1x à vista.")
            elif opcao_pagamento == "3":
                print("\n[PAGAMENTO] Boleto Bancário selecionado.")
            else:
                print("\n[AVISO] Opção inválida, prosseguindo com valor padrão.")

            # --- 2. VOLUME E FRETE ---
            print("\n--- DIMENSÃO DE VOLUME DO PACOTE ---")
            print("1 - Caixa Pequena (Leve / Compacto)")
            print("2 - Caixa Média (Volume Padrão)")
            print("3 - Caixa Grande / Volumoso (+ R$ 15,00 na taxa de cubagem)")
            
            opcao_volume = input("Escolha o volume/tamanho da embalagem (1-3): ")
            taxa_volume = 15.00 if opcao_volume == "3" else (5.00 if opcao_volume == "2" else 0.0)

            print("\n--- OPÇÕES DE ENTREGA ---")
            print("1 - Retirada na Loja Física (Grátis)")
            print("2 - Entrega Local / Motoboy (R$ 10,00 - 1 dia útil)")
            print("3 - Transportadora Expressa (R$ 25,00 - 3 dias úteis)")
            print("4 - Correios - SEDEX (R$ 38,00 - 5 dias úteis)")
            print("5 - Entrega Relâmpago / Same Day (R$ 50,00 - Até 3 horas)")
            
            opcao_entrega = input("Escolha o método de entrega (1-5): ")
            fretes = {"1": 0.0, "2": 10.00, "3": 25.00, "4": 38.00, "5": 50.00}
            valor_frete_base = fretes.get(opcao_entrega, 0.0)

            valor_frete_total = valor_frete_base + taxa_volume
            valor_total_final = valor_com_pagamento + valor_frete_total

            print("==================================================")
            print(f"VALOR TOTAL FINAL DA COMPRA: R$ {valor_total_final:.2f}".replace(".", ","))
            print("==================================================")

            # --- IDENTIFICAÇÃO DO CLIENTE PARA A VENDA ---
            print("\n--- IDENTIFICAÇÃO DO CLIENTE ---")
            cursor.execute("SELECT id_cliente, nome, status FROM clientes;")
            clientes = cursor.fetchall()
            for c in clientes:
                print(f"ID Cliente: {c[0]} | Nome: {c[1]} | Status: {c[2]}")
            
            id_cliente_escolhido = int(input("Digite o ID do cliente que está a realizar a compra: "))

            # --- GRAVAÇÃO NA BASE DE DADOS (VENDAS E ITENS) ---
            id_venda_atual = int(time.time())
            data_atual = date.today()

            # Insere na tabela 'venda'
            cursor.execute(
                "INSERT INTO venda (id_venda, id_cliente, data_venda, valor_total) VALUES (%s, %s, %s, %s);",
                (id_venda_atual, id_cliente_escolhido, data_atual, valor_total_final)
            )

            # Insere os itens na tabela 'item_venda' e atualiza o stock
            for index, item in enumerate(carrinho):
                id_item_venda = int(f"{id_venda_atual}{index}")
                
                cursor.execute(
                    "INSERT INTO item_venda (id_item_venda, id_venda, id_produto, quantidade) VALUES (%s, %s, %s, %s);",
                    (id_item_venda, id_venda_atual, item['id'], item['qtd'])
                )

                # Atualiza o stock do produto no banco
                cursor.execute("SELECT estoque FROM produto WHERE id_produto = %s", (item['id'],))
                estoque_atual = cursor.fetchone()[0]
                novo_estoque = max(0, estoque_atual - item['qtd'])
                cursor.execute("UPDATE produto SET estoque = %s WHERE id_produto = %s", (novo_estoque, item['id']))

            conexao.commit()
            print(f"\n[SUCESSO] Venda #{id_venda_atual} registada com sucesso no banco de dados NEXUS!")

        cursor.close()
        conexao.close()

    except mysql.connector.Error as erro:
        print(f"\n[ERRO DE CONEXÃO COM O MYSQL]: {erro}")

if __name__ == "__main__":
    realizar_compra()