let prompt = require("prompt-sync");
prompt = prompt();

console.log("Somar, Subtrair, Multiplicar e Dividir dois Números");

const n1 = parseFloat(prompt("Digite o primeiro número:"));
const n2 = parseFloat(prompt("Digite o segundo número:"));

console.log(`A Soma do primeiro número com o segundo é: ${n1+n2} `); 
console.log("A Subtração entre n1 e n2 (n1-n2) é:", n1-n2); 
console.log("A Multiplicação do n1 e n2 (n1*n2) é:", n1*n2); 
console.log(`A Divisão do primeiro número com o segundo é: ${n1/n2} `); 
