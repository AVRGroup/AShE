// Função para calcular o produto escalar de dois vetores
function dotProduct(v1, v2) {
    return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
}

// Função para calcular a magnitude (norma) de um vetor
function magnitude(vector) {
    return Math.sqrt(vector[0] ** 2 + vector[1] ** 2 + vector[2] ** 2);
}

// Função para calcular as diferenças angulares entre pares correspondentes de vetores em graus
// com a possibilidade de inverter o segundo conjunto de vetores
function angularDifferences(vetores1, vetores2, invertSecond = false) {
    if (vetores1.length !== vetores2.length) {
        throw new Error("As matrizes de vetores devem ter o mesmo comprimento.");
    }

    const differences = [];

    for (let i = 0; i < vetores1.length; i++) {
        // Vetor ground truth
        const v1 = vetores1[i];

        // Vetor gerado
        let v2 = vetores2[i];

        // Se 'invertSecond = true', inverte o vetor gerado
        if (invertSecond) {
            v2 = [-v2[0], -v2[1], -v2[2]];
        }

        // Calcula o produto escalar
        const dot = dotProduct(v1, v2);

        // Calcula as magnitudes
        const magV1 = magnitude(v1);
        const magV2 = magnitude(v2);

        // Calcula o cosseno do ângulo
        let cosTheta = dot / (magV1 * magV2);

        // Para evitar erro de arredondamento fora de [-1, 1]
        cosTheta = Math.max(-1, Math.min(1, cosTheta));

        // Calcula a diferença angular (radianos -> graus)
        const angleRad = Math.acos(cosTheta);
        const angleDeg = angleRad * (180 / Math.PI);

        differences.push(`Par ${i+1}: ${angleDeg.toFixed(2)}°`);
    }

    return differences;
}

// Exemplo: vetores1 = ground truth, vetores2 = vetores gerados
const vetores1 = [
    [1.15, 7, -4],
];

const vetores2 = [
    [-0.67, -1.42, 1.26],
];

// 1) Calcula ângulos sem inverter
let diffs = angularDifferences(vetores1, vetores2, false);
console.log("Ângulos sem inverter o segundo conjunto:", diffs);

// 2) Calcula ângulos *invertendo* o segundo conjunto
let diffsInverted = angularDifferences(vetores1, vetores2, true);
console.log("Ângulos invertendo o segundo conjunto:", diffsInverted);
