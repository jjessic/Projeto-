#include <stdio.h>
#define TAM 10

void exibirVetor(int vetor[], int tamanho) {
    int i;
   
    for (i = 0; i < tamanho; i++) {
        printf("%d ", vetor[i]);
   
    }
   
    printf("\n");
}

void insertionSort(int vetor[], int tamanho){
    int i, j, chave;
   
    for (i = 1; i < tamanho; i++) {
        chave = vetor[i];
        j = i - 1;
       
        while (j >= 0 && vetor[j] > chave) {
            vetor[j + 1] = vetor[j];
            j--;
           
        }
       
        vetor[j + 1] = chave;
        printf("Iteracao %d: ", i);
        exibirVetor(vetor, tamanho);
    }
}

int main() {
    int vetor[TAM];
    int i;
   
    printf("Digite 10 numeros inteiros:\n");
   
    for (i = 0; i < TAM; i++) {
        printf("Elemento %d: ", i + 1);
        scanf("%d ", &vetor[i]);
       
    }
   
    printf("\nVetor original:\n");
    exibirVetor(vetor, TAM);
   
    printf("\nProcesso de ordenacao - Insertion Sort:\n");
    insertionSort(vetor, TAM);
   
    printf("\nVetor completamente ordenado:\n");
    exibirVetor(vetor, TAM);
   
    return 0;
}
