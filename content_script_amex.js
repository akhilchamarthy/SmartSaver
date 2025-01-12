var buttons = document.querySelectorAll('button[title="Add to Card"]'); 
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