const messageClasses = {
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
};

export function createHud(messageElement, toggleNotesButton) {
  return {
    setMessage(text, tone = 'info') {
      messageElement.textContent = text;
      messageElement.className = `message ${messageClasses[tone] ?? messageClasses.info}`;
    },
    setNotesActive(active) {
      toggleNotesButton.dataset.active = String(active);
      toggleNotesButton.textContent = active ? 'Desactivar notes' : 'Activar notes';
    },
  };
}
