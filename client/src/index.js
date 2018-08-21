function component() {
  const element = document.createElement('div');
  element.innerHTML += 'Yellow notes';
  return element;
}

document.body.appendChild(component());
