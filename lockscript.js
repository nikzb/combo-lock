//lockscript.js 
//Copyright 2015- Nik Baltatzis

var radius = 100; //radius of the dial
var originalRadius = radius; //store the original radius of the dial for reset, zooming
var numTicks = 40; //the number of tick  marks on the dial
var turnSpeed = 3.0; //the current turn speed
const mediumTurnSpeed = 3.0; //use to scale the speed correctly

//these will be changed to true as the placeholders are replaced
var number1Replaced = false;
var number2Replaced = false;
var number3Replaced = false;

var canvas = document.getElementById('myCanvas');
var context = canvas.getContext('2d');

//the offset determines where the center of the dial is
var xOffset = canvas.width / 2;
var yOffset = canvas.height * 0.67;

//angle that the dial is currently turned, relative to 0
var currentAngle = 0;

//array used to store each rotation of the dial
var imageRots = [];

//set to true if shackle should be opened at the end of the rotateImage function
var shouldOpen = false;

//this is used to reset correctly after the animation of opening the lock has been finished
var shackleIsOpen = false;

//set the center of rotation to the center of the window
context.translate(xOffset, yOffset);

//modes are either unlock or stepByStep
var mode = "unlock";
var step = 0;

 window.requestAnimFrame = (function(callback) {
	return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
	function(callback) {
		window.setTimeout(callback, 1000 / 60);
	};
 })();
 
 // An object used to store the rotations.  
 function ImageRotation(angleTurned, totalAngle, number) {
	this.angleTurned = angleTurned;
	this.totalAngle = totalAngle;
	this.number = number; //number in the combination, i.e. 1, 2, or 3
}

// Clear the canvas so a new image can be drawn
function clearCanvas(canvas, context) {
	// clear the previous image
	context.save();
	//fix for correct offset
	context.translate(-xOffset, -yOffset);
	context.clearRect(0, 0, canvas.width, canvas.height);
	context.restore();
}

// Redraw the lock based on the current conditions
function redrawLock(canvas, context) {
	//draw the new image
	drawShackle(radius, context);
	drawLockBody(radius, context);
	
	// draw the dial at the correct orientation
	context.save();
	context.rotate(currentAngle);
	drawDial(radius, context);
	context.restore();
}

// Zoom in to show the lock in the original size after a reset.
function returnToOriginalSize(canvas, context) {
	
	if (radius < originalRadius) {
		clearCanvas(canvas, context);
		
		//update the radius
		radius += 0.01 * originalRadius;
		
		redrawLock(canvas, context);
		
		// request new frame
		requestAnimFrame(function() {
			returnToOriginalSize(canvas, context);
		});
	}
	
	shackleIsOpen = false;
}

// Open the shackle when combination is completed
function openShackle(distanceOpened, canvas, context) {
	
	//zoom out so shackle doesn't open out of view
	if (radius > originalRadius * 0.75 && shouldOpen) {
		// clear the previous image
		context.save();
		//fix for correct offset
		context.translate(-xOffset, -yOffset);
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.restore();
		
		//update the radius
		radius -= 0.01 * originalRadius;
		
		//draw the new image
		drawShackle(radius, context);
		drawLockBody(radius, context);
		
		// draw the dial at the correct orientation
		context.save();
		context.rotate(currentAngle);
		drawDial(radius, context);
		context.restore();
		
		// request new frame
		requestAnimFrame(function() {
			openShackle(distanceOpened, canvas, context);
		});
	}	
	else if (distanceOpened < radius * 0.8 && shouldOpen) {
		// clear the previous image
		context.save();
		//fix for correct offset
		context.translate(-xOffset, -yOffset);
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.restore();
		
		//draw the new image
		context.save()
		context.translate(0, -distanceOpened);
		drawShackle(radius, context);
		context.restore();	
		
		distanceOpened += radius * .03;
		
		drawLockBody(radius, context);
		
		// draw the dial at the correct orientation
		context.save();
		context.rotate(currentAngle);
		drawDial(radius, context);
		context.restore();
		
		// request new frame
		requestAnimFrame(function() {
			openShackle(distanceOpened, canvas, context);
		});
	}
	
	/*simultaneous version
	if (distanceOpened < radius * 0.8) {
		//update the radius
		radius -= 0.01 * originalRadius;
		// clear the previous image
		context.save();
		//fix for correct offset
		context.translate(-xOffset, -yOffset);
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.restore();
		
		//draw the new image
		context.save()
		context.translate(0, -distanceOpened);
		drawShackle(radius, context);
		context.restore();	
		
		distanceOpened += radius * .03;
		
		drawLockBody(radius, context);
		
		// draw the dial at the correct orientation
		context.save();
		context.rotate(currentAngle);
		drawDial(radius, context);
		context.restore();
		
		// request new frame
		requestAnimFrame(function() {
			openShackle(distanceOpened, canvas, context);
		});
	}
	*/
}

// Animate the dial rotating
function rotateImage(canvas, context) {
	if (imageRots.length === 0)
		return;
	
	// only repeat if the angle turned is less than the total angle to be turned
	var angleLeftToTurn = Math.abs(imageRots[0].totalAngle) - imageRots[0].angleTurned;
	
	var percentOfAngleTurned = imageRots[0].angleTurned / Math.abs(imageRots[0].totalAngle);
	var x = percentOfAngleTurned * Math.PI;
	var angleToTurnNow = (turnSpeed / mediumTurnSpeed) * (Math.sin(x + Math.PI / 12) + 0.5) * imageRots[0].totalAngle / 90;
	
	if (angleLeftToTurn > 0) //if still turning
	{
		// must turn the standard amount or the remaining amount if less than the standard amount
		// must update the current angle for the rotated dial as well as the angleTurned for this rot object
		if (angleLeftToTurn < Math.abs(imageRots[0].totalAngle) / 180) {
			if (imageRots[0].totalAngle > 0) {
				currentAngle += angleLeftToTurn; 
				imageRots[0].angleTurned += angleLeftToTurn;
			}
			else {
				currentAngle -= angleLeftToTurn; 
				imageRots[0].angleTurned += angleLeftToTurn;
			}
		}
		else {
			//update the current angle for the rotated dial as well as the angleTurned for this rot object
			currentAngle += angleToTurnNow; 
			imageRots[0].angleTurned += Math.abs(angleToTurnNow);
		}
		
		// clear the previous image
		context.save();
		//fix for correct offset
		context.translate(-xOffset, -yOffset);
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.restore();
		
		drawShackle(radius, context);
		drawLockBody(radius, context);
		
		// draw the updated dial
		context.save();
		context.rotate(currentAngle);
		drawDial(radius, context);
		context.restore();

		// request new frame
		requestAnimFrame(function() {
			rotateImage(canvas, context)
		});
	} 
	else{
		// if finished a turn but there are still additional turns to make
		if (imageRots.length > 1) {
			//if in unlock mode, keep going
			if (mode === "unlock") {
				//remove the first rotation element in the array
				imageRots.shift();
				
				// go on to the next turn after brief pause
				setTimeout(function() {requestAnimFrame(function() {
					rotateImage(canvas, context)
				})}, 1000 * mediumTurnSpeed / turnSpeed);
			}
			else if (imageRots[0].number === imageRots[1].number) { // in stepByStep, but same number, so keep going
				//remove the first rotation element in the array
				imageRots.shift();
				
				// go on to the next turn after brief pause
				setTimeout(function() {requestAnimFrame(function() {
					rotateImage(canvas, context)
				})}, 1000 * mediumTurnSpeed / turnSpeed);
			}
			else { //in stepByStep, but not same number, so remove rot element and wait for next click
				//remove the first rotation element in the array
				imageRots.shift();
				if (step < 3) {
					$("#stepByStep").prop('disabled', function(i, v) { return !v; });
				}
			}			
		}
		else if (mode === "reset"){ //finished with turns
			//after reset turn is complete
			if ($("#unlock").prop('disabled'))
				$("#unlock").prop('disabled', function(i, v) { return !v; });
			if ($(".combo-numbers").prop('disabled'))
				$(".combo-numbers").prop('disabled', function(i, v) { return !v; });
			if ($("#stepByStep").prop('disabled'))
				$("#stepByStep").prop('disabled', function(i, v) { return !v; });
			if ($("#dialSlider").prop('disabled'))
				$("#dialSlider").prop('disabled', function(i, v) { return !v; });
			step = 0;
		}
		else { 
			//done opening lock
			imageRots.length = 0;
			if (shouldOpen && !shackleIsOpen) { //open shackle if completed combination
				openShackle(0, canvas, context);
				shackleIsOpen = true;
			}

		}
	}
		
}

// Return the angle, in radians, for turning the given amount of numbers on the current dial
function dialNumbersToRadians(dialNumbers) {
	return (dialNumbers * 2 * Math.PI) / numTicks;
}

// Return true if the number is on the dial, otherwise return false.
function numberInRange(number) {
	return (number >= 0 && number < numTicks);
}

/* Given the 3 numbers in the combination, load the imageRots array with all the turns to open the lock correctly.
 * Then initiate the animation. 
 */
function openLock(number1, number2, number3, canvas, context) {
	shouldOpen = true;
	
	//clear out the imageRots array to start fresh
	imageRots.length = 0;
	
	//add turns to imageRots array to reach first number
	imageRots.push(new ImageRotation(0, dialNumbersToRadians(numTicks), 1));
	imageRots.push(new ImageRotation(0, dialNumbersToRadians(numTicks), 1));
	imageRots.push(new ImageRotation(0, dialNumbersToRadians(numTicks - number1), 1));
	
	//add turns to imageRots array to reach second number
	imageRots.push(new ImageRotation(0, dialNumbersToRadians(-numTicks), 2));
	if (number2 > number1) {
		imageRots.push(new ImageRotation(0, dialNumbersToRadians(-(number2 - number1)), 2));
	}
	else {
		imageRots.push(new ImageRotation(0, dialNumbersToRadians((-numTicks + number1) - number2), 2));
	}
	
	//add turn to imageRots array to reach third number
	if (number2 > number3) {
		imageRots.push(new ImageRotation(0, dialNumbersToRadians(number2 - number3), 3));
	}
	else {
		imageRots.push(new ImageRotation(0, dialNumbersToRadians(number2 + numTicks - number3), 3));	
	}
	
	//initiate spinning animation
	rotateImage(canvas, context);
}

//spin the dial back to zero
function reset() {
	shouldOpen = false;

	if (mode === "stepByStep" && (imageRots.length === 1 || imageRots.length === 3)) {
		mode = "reset";
		imageRots.length = 0;
		imageRots.push(new ImageRotation(0, 2 * Math.PI - currentAngle % (2 * Math.PI), 0));
		rotateImage(canvas, context);
	}
	else if (shackleIsOpen) {
		mode = "reset";
		imageRots.length = 0;
		imageRots.push(new ImageRotation(0, 2 * Math.PI - currentAngle % (2 * Math.PI), 0));
		rotateImage(canvas, context);
		returnToOriginalSize(canvas, context);
	}	
	else {
		mode = "reset";
		imageRots.length = 0;
		imageRots.push(new ImageRotation(0, 2 * Math.PI - currentAngle % (2 * Math.PI), 0));
	}
}

function drawDial(radius, context) {
	context.beginPath();
	
	var startAngle = -Math.PI / 2;;
    var endAngle = 1.5 * Math.PI;
    var counterClockwise = false;
	
	context.lineWidth = radius * 0.02;
	context.strokeStyle = '#000000';
	
	//draw outer circle of dial
    context.beginPath();
    context.arc(0, 0, radius, startAngle, endAngle, counterClockwise);
	context.fillStyle = 'black';
    context.fill();
    context.stroke();
	
	//draw tick marks
	context.beginPath();
	context.strokeStyle = 'white';
	
	for (var angle = startAngle; angle < endAngle; angle+= 2 * Math.PI / numTicks)
	{
		//go to starting point
		var x = radius * Math.cos(angle);
		var y = radius * Math.sin(angle);
		context.moveTo(x, y);
		
		//move to make line
		x = (radius * .9) * Math.cos(angle);
		y = (radius * .9) * Math.sin(angle);
		context.lineTo(x, y);
	}
	
	context.stroke();
	
	//draw longer tick marks for multiples of 5
	context.beginPath();	
	context.lineWidth = radius * 0.03;
	
	var number = 0;
	for (var angle = startAngle; angle < endAngle; angle += 2 * Math.PI / numTicks * 5) {
		
		//go to starting point
		var x = radius * Math.cos(angle);
		var y = radius * Math.sin(angle);
		context.moveTo(x, y);
		
		//move to make line
		x = (radius * .8) * Math.cos(angle);
		y = (radius * .8) * Math.sin(angle);
		context.lineTo(x, y);
	}
	
	context.stroke();
	
	//draw numbers for multiples of 5
	context.beginPath();
	
	var fontSize;
	if (numTicks > 40) {
		fontSize = Math.round(radius * 0.20) / (numTicks / 40);
	}
	else {
		fontSize = Math.round(radius * 0.20);
	}

	context.fillStyle = 'white';
	context.font = ''+fontSize+'pt Arial';
	
	for (var number = 0; number < numTicks; number += 5) {
		context.save();
		context.rotate(2 * Math.PI / numTicks * number);
		if (numTicks > 40) {
			if (number < 10)
				context.fillText(""+number, -radius * fontSize * 0.0033, -radius * (0.6 + (numTicks - 40) * .001));
			else
				context.fillText(""+number, -radius * fontSize * 0.006, -radius * (0.6 + (numTicks - 40) * .001));
		}
		else {
			if (number < 10)
				context.fillText(""+number, -radius * 0.07, -radius * 0.58);
			else
				context.fillText(""+number, -radius * 0.13, -radius * 0.58);
		}
		
		
		context.restore();
	}
	
	//draw knob
	var knobOuterCircleRadius = radius * 0.5;
	var knobInnerCircleRadius = radius * 0.43;
	
	context.lineWidth = radius * 0.01;
    context.beginPath();
	context.strokeStyle = '#303030';
    context.arc(0, 0, knobOuterCircleRadius, startAngle, endAngle, counterClockwise);
	
	for (var angle = startAngle; angle < endAngle; angle+= Math.PI / 40)
	{
		//go to starting point
		var x = knobOuterCircleRadius * Math.cos(angle);
		var y = knobOuterCircleRadius * Math.sin(angle);
		context.moveTo(x, y);
		
		//move to make line
		x = knobInnerCircleRadius * Math.cos(angle);
		y = knobInnerCircleRadius * Math.sin(angle);
		context.lineTo(x, y);
	}
	
	context.arc(0, 0, knobInnerCircleRadius, startAngle, endAngle, counterClockwise);
	context.stroke();	
}

//draw shackle
function drawShackle(dialRadius, context) {
	var outsideX = dialRadius * 0.9;//dialRadius * Math.cos(-Math.PI / 4);
	var bottomY = 0;//dialRadius * Math.sin(-Math.PI / 4) + dialRadius * 0.5;
	var insideX = outsideX - dialRadius * 0.3;
	var topY = bottomY - dialRadius * 2.5;
	var bottomCurveY = topY + dialRadius; //bottom of where the shackle curves
	var bottomLeftY = bottomCurveY + dialRadius;
	var bottomNotchY = bottomLeftY - dialRadius * 0.2;
	var notchX = -(outsideX - dialRadius * 0.2);
	
	var counterClockwise = true;
	
	context.beginPath();
	context.lineWidth = dialRadius * 0.03;
	context.strokeStyle = 'black';
	
	context.moveTo(outsideX, bottomY);
	context.lineTo(outsideX, bottomCurveY);
	context.arc(0, bottomCurveY, outsideX, 0, Math.PI, counterClockwise);
	context.lineTo(-outsideX, bottomLeftY);
	context.lineTo(-insideX, bottomLeftY);
	context.lineTo(-insideX, bottomNotchY);
	context.lineTo(notchX, bottomNotchY);
	context.arc(-insideX, bottomNotchY, dialRadius * 0.15, Math.PI, 3 * Math.PI / 2, !counterClockwise);
	context.lineTo(-insideX, bottomCurveY);
	context.arc(0, bottomCurveY, insideX, Math.PI, 0, !counterClockwise);
	context.lineTo(insideX, bottomY);
	context.lineTo(outsideX, bottomY);
	context.fillStyle = '#c0c0c0';
    context.fill();
	
	context.stroke();
}

//draw lock body
function drawLockBody(dialRadius, context) {
	var startAngle = -3 * Math.PI / 4;
    var endAngle = 5 * Math.PI / 4;
    counterClockwise = false;
	
    context.beginPath();
    context.arc(0, -dialRadius * 0.1, dialRadius*1.2, startAngle, endAngle, counterClockwise);
	context.lineWidth = dialRadius * 0.03;
	context.strokeStyle = 'black';
	context.fillStyle = '#c0c0c0';
    context.fill();
	context.stroke();
	
	//draw pointer thingy
	context.beginPath();
	context.lineWidth = dialRadius * 0.01;
	context.strokeStyle = '#e30000';
	context.moveTo(0, -dialRadius);
	context.lineTo(-dialRadius * 0.1, -dialRadius * 1.15);
	context.lineTo(dialRadius * 0.1, -dialRadius * 1.15);
	context.lineTo(0, -dialRadius);
	context.fillStyle = '#e30000';
    context.fill();
	context.stroke();
}

//checks each input to see if it invalid. If it is invalid, shake it to alert the user
function shakeBadInputs() {
	if (!numberInRange(number3)) {
		$num3 = $("#number3");
		$num3.select();
		$num3.addClass("invalid");
	}
	
	if (!numberInRange(number2)) {
		$num2 = $("#number2");
		$num2.select();
		$num2.addClass("invalid");
	}
	
	if (!numberInRange(number1)) {
		$num1 = $("#number1");
		$num1.select();
		$num1.addClass("invalid");
	}	
}

// update the dial when the dial slider is modified
function updateDial() {
	numTicks = Number($("#dialSlider").val());
	$(".combo-numbers").attr("max", ""+numTicks);
	
	clearCanvas(canvas, context);
	redrawLock(canvas, context);
}

// update the speed when the speed slider is modified
function updateSpeed() {
	turnSpeed = $("#speedSlider").val();
}

// when the page loads, draw the lock
window.onload = function() {
	
	drawShackle(radius, context);
	drawLockBody(radius, context);
	drawDial(radius, context);
	
	updateSpeed();
	updateDial();
			
	if ($(".combo-numbers").prop('disabled') === true) {
		$(".combo-numbers").prop('disabled', function(i, v) { return !v; });
	}
	if ($("#unlock").prop('disabled') === true) {
		$("#unlock").prop('disabled', function(i, v) { return !v; });
	}
	if ($("#stepByStep").prop('disabled') === true) {
		$("#stepByStep").prop('disabled', function(i, v) { return !v; });
	}
	if ($("#dialSlider").prop('disabled'))
		$("#dialSlider").prop('disabled', function(i, v) { return !v; });
};

$(document).ready(function() {
	/* select the whole number in the field so that it is replaced when the user types a new number
	$(".combo-numbers").on("click", function () {
		$(this).select();
	});	
	*/
	$("#number1").click(function() {
		number1Replaced = true;
		$("#number1").attr("placeholder", "");
	});
	
	$("#number2").click(function() {
		number2Replaced = true;
		$("#number2").attr("placeholder", "");
	});
	
	$("#number3").click(function() {
		number3Replaced = true;
		$("#number3").attr("placeholder", "");
	});
		
	$("#unlock").click(function() {
		$( "#number1" ).removeClass("invalid");
		$( "#number2" ).removeClass("invalid");
		$( "#number3" ).removeClass("invalid");
		
		if ($("#unlock").val() === "Unlock") {
			
			//use placeholders if they haven't been replaced
			if (!number1Replaced)
			{
				$("#number1").val("10");
			}
			if (!number2Replaced)
			{
				$("#number2").val("30");
			}
			if (!number3Replaced)
			{
				$("#number3").val("20");
			}
			
			//make sure numbers are treated as numbers, not as strings			
			number1 = Number($("#number1").val());
			number2 = Number($("#number2").val());
			number3 = Number($("#number3").val());
			
			//make sure numbers were not left blank. If so, set to invalid value
			if ($("#number1").val() === "" )
			{
				number1 = -1;
			}
			if ($("#number2").val() === "" )
			{
				number2 = -1;
			}
			if ($("#number3").val() === "" )
			{
				number3 = -1;
			}
			
			//if numbers are valid, open lock
			if (numberInRange(number1) && numberInRange(number2) && numberInRange(number3)) {
				
				mode = "unlock";
				openLock(number1, number2, number3, canvas, context);
				
				$(".combo-numbers").prop('disabled', function(i, v) { return !v; });
				if (!$("#unlock").prop('disabled'))
					$("#unlock").prop('disabled', function(i, v) { return !v; });
				$("#unlock").val("Reset");
				$("#unlock").prop('disabled', function(i, v) { return !v; });
				$("#stepByStep").hide();
				$("#dialSlider").prop('disabled', function(i, v) { return !v; });
			}
			else //there is at least one invalid input
			{
				//shake the invalid inputs to get the users attention
				shakeBadInputs();
			}
		}
		else {
			reset(); 
			
			//enable everything
			if (!$("#stepByStep").prop('disabled'))
				$("#stepByStep").prop('disabled', function(i, v) { return !v; });
			if (!$("#unlock").prop('disabled'))
				$("#unlock").prop('disabled', function(i, v) { return !v; });
			if (!$("#dialSlider").prop('disabled'))
				$("#dialSlider").prop('disabled', function(i, v) { return !v; });
			
			//set the labels back to the initial values
			$("#unlock").val("Unlock");
			$("#stepByStep").val("Step by Step");
			$("#stepByStep").show();
		}
		
		
	});
	
	$("#stepByStep").click(function() {
		$( "#number1" ).removeClass("invalid");
		$( "#number2" ).removeClass("invalid");
		$( "#number3" ).removeClass("invalid");
		
		if ($("#stepByStep").val() === "Step by Step") {
			
			//Use placeholders if they haven't been replaced
			if (!number1Replaced)
			{
				$("#number1").val("10");
			}
			if (!number2Replaced)
			{
				$("#number2").val("30");
			}
			if (!number3Replaced)
			{
				$("#number3").val("20");
			}
			
			//make sure numbers are treated as numbers, not as strings
			number1 = Number($("#number1").val());
			number2 = Number($("#number2").val());
			number3 = Number($("#number3").val());
			
			//make sure numbers were not left blank. If so, set to invalid value
			if ($("#number1").val() === "" )
			{
				number1 = -1;
			}
			if ($("#number2").val() === "" )
			{
				number2 = -1;
			}
			if ($("#number3").val() === "" )
			{
				number3 = -1;
			}
		
			//if numbers are valid, open lock step by step
			if (numberInRange(number1) && numberInRange(number2) && numberInRange(number3)) {
				mode = "stepByStep";
				step = 1;

				openLock(number1, number2, number3, canvas, context);
	
				$(".combo-numbers").prop('disabled', function(i, v) { return !v; });
				$("#unlock").val("Reset");
				$("#stepByStep").prop('disabled', function(i, v) { return !v; });
				$("#stepByStep").val("Next Step");
				$("#dialSlider").prop('disabled', function(i, v) { return !v; });
				
			}
			else { //there is at least one bad input
				shakeBadInputs();
			}
		}
		else { //text should be "Next Step"
			step++;
			if (step === 2) {
				rotateImage(canvas, context);
				if (!$("#stepByStep").prop('disabled'))
					$("#stepByStep").prop('disabled', function(i, v) { return !v; });
			}
			else { //(step === 3) 
				rotateImage(canvas, context);
				$("#stepByStep").hide();				
			}
		}
	});
});
