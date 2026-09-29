

int main() {

    int x[] = {4, 2, 7, 1};
    int n = 4;
    int i, j, menor, temp;

    for(i = 0; i < n - 1; i++) {
        menor = i;

        for (j = i + 1; j < n; j++) {
            if (x[j] < x[menor]) {
                menor = j;
            }
        }

        temp = x [i];
        x[i] = x[menor];
        x[menor] = temp;
    }

    printf("Vetor ordenado: ");

    for (i = 0; i < n; i++) {
    printf("%d ", x[i]);
    }

    printf("\n");
    return 0;
}