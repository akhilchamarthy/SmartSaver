if (document.querySelectorAll('button[title="add to list card"]') != null) {
    var buttons = document.querySelectorAll('button[title="add to list card"]'); 
}
else {
    var buttons = document.querySelectorAll('button[title="add to card"]'); 
}
// Loop through each button 
if (buttons != null)
    {
    buttons.forEach((button, index) => { 
    setTimeout(() => { button.click(); }, index * 500); 
    });
    }
else {
    console.log("Already added all offers")
}