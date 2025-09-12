// Function to convert number to words
export function numberToWords(num: number): string {
  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const b = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const inWords = (n: number): string => {
    let str = '';
    if (n > 9999999) {
      str += inWords(Math.floor(n / 10000000)) + ' Crore ';
      n %= 10000000;
    }
    if (n > 99999) {
      str += inWords(Math.floor(n / 100000)) + ' Lakh ';
      n %= 100000;
    }
    if (n > 999) {
      str += inWords(Math.floor(n / 1000)) + ' Thousand ';
      n %= 1000;
    }
    if (n > 99) {
      str += inWords(Math.floor(n / 100)) + ' Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
    } else {
      str += a[n];
    }
    return str;
  };

  const [integerPart, decimalPart] = Math.floor(num).toString().split('.');
  const integerWords = inWords(Number(integerPart));

  let finalString = 'Rupees ' + integerWords.trim() + ' Only';
  return finalString.replace(/\s+/g, ' ').trim();
}
