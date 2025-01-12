var buttons = document.querySelectorAll('div[role="button"]');
// Loop through each button
if (buttons != null) {
  buttons.forEach((button, index) => {
      button.click();
    setTimeout(() => {
        window.history.back();
    }, 2000);
  });
} else {
  console.log("Already added all offers");
}
