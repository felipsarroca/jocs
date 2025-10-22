const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function createKeypad(container, { onDigit, onClear }) {
  container.innerHTML = '';

  for (const digit of DIGITS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = String(digit);
    button.addEventListener('click', () => onDigit(digit));
    container.appendChild(button);
  }

  const clearButton = document.createElement('button');
  clearButton.type = 'button';
  clearButton.textContent = 'Esborra';
  clearButton.classList.add('keypad-action');
  clearButton.addEventListener('click', () => onClear());
  container.appendChild(clearButton);

  return {
    focusDigit(digit) {
      const index = DIGITS.indexOf(digit);
      if (index === -1) return;
      container.children[index]?.focus({ preventScroll: true });
    },
  };
}
