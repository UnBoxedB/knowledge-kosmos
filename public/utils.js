// Compute number of lines needed to fit text
function computeTextBlockHeight(text, maxWidth, fontSize) {
    console.log(`Input to computeTextBlockHeight: text=${text}, maxWidth=${maxWidth}, fontSize=${fontSize}`);
  
    const words = text.split(" ");
    let line = [];
    let lineNumber = 0;
    const lineHeight = 1.1; // ems
  
    const tempSvg = d3.create("svg").style("position", "absolute").style("visibility", "hidden");
    document.body.appendChild(tempSvg.node());
    const tempText = tempSvg.append("text").style("font-size", `${fontSize}px`);
  
    words.forEach((word) => {
      line.push(word);
      tempText.text(line.join(" "));
      const computedLength = tempText.node().getComputedTextLength();
      //console.log(`Word: ${word}, Line: ${line.join(" ")}, Computed length: ${computedLength}`);
      if (computedLength > maxWidth) {
        line.pop();
        tempText.text(line.join(" "));
        line = [word];
        lineNumber++;
        //console.log(`Line number incremented to ${lineNumber}`);
      }
    });
  
    // Add 1 to lineNumber if there are remaining words in the line
    if (line.length > 0) {
      lineNumber++;
    }
  
    tempSvg.remove();
    //console.log(`Final line number: ${lineNumber}`);
    const textHeight = lineNumber * fontSize * lineHeight;
    //console.log(`Computed height for text: ${textHeight}`);
  
    return textHeight;
  };
  
  //Wrap text in boxes of set width
  function wrap(text, width) {
    text.each(function() {
        const text = d3.select(this);
        const words = text.text().split(/\s+/).reverse();
        let word;
        let line = [];
        let lineNumber = 0;
        const lineHeight = 1.1; // ems
        const x = text.attr("x");
        const y = text.attr("y");
        const dy = parseFloat(text.attr("dy")) || 0;
        let tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
  
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > (width-20)) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                //tspan = text.append("tspan").attr("x", x).attr("y", function() { return lineNumber * lineHeight * fontSize; }).text(word);
                tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", (++lineNumber * lineHeight + dy) + "em").text(word);
            }
        }
    });
  }