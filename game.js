//Attach initialization callback
window.addEventListener('load',init,false);

//Global variables
var canvas = null;	//black "shadow" lines
var canvas2 = null;	//red "stroke" lines
var canvas3 = null;	//Ending animations
var ctx = null;
var ctx2 = null;
var ctx3 = null;

//States
var STATE_DRAWING = 0;
var STATE_FINISHED = 1;
var mState = 0;

//"Class" variables
var gFPS = 60;
var mPoints = new Array();
var NULL_POINT = new Point(-1,-1);
var mIndex = 0;

//"Boys"
var mBoys = new Array();
var iBoy1 = new Image(); iBoy1.src = 'media/boy1.png';
var iBoy2 = new Image(); iBoy2.src = 'media/boy2.png';
var iBoy3 = new Image(); iBoy3.src = 'media/boy3.png';
var iBoy4 = new Image(); iBoy4.src = 'media/boy4.png';
var iBoy5 = new Image(); iBoy5.src = 'media/boy5.png';
var iBoy6 = new Image(); iBoy6.src = 'media/boy6.png';
var iBoy7 = new Image(); iBoy7.src = 'media/boy7.png';
var gBoyImgs = new Array();
gBoyImgs.push(iBoy1);
gBoyImgs.push(iBoy2);
gBoyImgs.push(iBoy3);
gBoyImgs.push(iBoy4);
gBoyImgs.push(iBoy5);
gBoyImgs.push(iBoy6);
gBoyImgs.push(iBoy7);

//"Stars"
var mStars = new Array();
var mTimeAdd = 0;
var starImg = new Image(); starImg.src = 'media/star.png';

//Initialization function
function init()
{
	canvas = document.getElementById('canvas');
	canvas.style.background = '#A0A0A0';
	ctx = canvas.getContext('2d');
	
	canvas2 = document.getElementById('canvas2');
	canvas2.style.background = '#FFFFFFFF';
	ctx2 = canvas2.getContext('2d');
	
	canvas3 = document.getElementById('canvas3');
	//canvas3.style.background = '#FFFFFFFF';
	ctx3 = canvas3.getContext('2d');
	
	gameInitialization();
	
	//Generate game loop
	setInterval(run,1000/gFPS);
}

function gameInitialization()
{
	definePoints();
	//incrementLineSegments(2);
	normalizeSegments();
	randomizeSegments();
}

//Game loop
function run()
{
	update();
	paint();
}

//Update game logic
function update()
{
	var elapsed = 1 / gFPS;

	switch (mState)
	{
		case STATE_DRAWING:
			drawNextLine();
			break;
			
		case STATE_FINISHED:
			//update boys		
			for(var i=0; i<mBoys.length; i++) {
				mBoys[i].update(elapsed);
			}
			//update stars
			mTimeAdd -= elapsed;
			if (mTimeAdd < 0)
			{
				mTimeAdd = 0.25 + Math.random() * 0.15;
				addStar();
			}
			for (var i = 0; i < mStars.length; i++)
			{
				mStars[i].update(elapsed);
				
				if (mStars[i].isDead)
				{
					mStars.splice(i, 1);
					i--;
				}
			}
			break;
	}
}

function addStar()
{
	var xPos = canvas3.width * Math.random();
	var yPos = -20;
	var velX = 0;
	var velY = 80 + Math.random() * 20;
	var rotation = Math.random() * 360;
	
	var star = new Star(xPos,yPos,velX,velY,rotation);
	mStars.push(star);
}

function Star(_x, _y, _xVel, _yVel, _rotation)
{
	this.x = _x;
	this.y = _y;
	this.xVel = _xVel;
	this.yVel = _yVel;
	this.rotation = _rotation;
	this.isDead = false;
	
	this.update = function(dt)
	{	
		this.x += _xVel * dt;
		this.y += _yVel * dt;
		this.rotation += 180 * dt;
				
		if (this.y > canvas3.height + 50)
		{
			this.isDead = true;
		}
	}
	
	this.render = function(myCtx)
	{
		myCtx.save();
		myCtx.translate(this.x,this.y);
		myCtx.rotate(this.rotation*Math.PI/180);
		myCtx.drawImage(starImg,0,0);
		myCtx.restore();
	}
}

//Rendering function
function paint()
{
	//Clear screen
	ctx3.clearRect(0,0,canvas3.width,canvas3.height);
	
	var i;
	
	//render boys
	for(i=0; i<mBoys.length; i++) {
		mBoys[i].render(ctx3);
	}
	//render stars
	for(i=0; i<mStars.length; i++) {
		mStars[i].render(ctx3);
	}
}

function drawNextLine()
{
	// Abort if reached the last point
	if (mIndex >= mPoints.length) 
	{
		setFinishState();
		return;
	}
	
	var pointA = mPoints[mIndex++];
	var pointB = mPoints[mIndex++];
	
	//Draw "shadow" line
	var dx = 2;
	var dy = 2;
	ctx.lineWidth = 5;
	ctx.lineCap = "round";
	ctx.lineJoin = "round";
	ctx.miterLimit = 3;
	ctx.strokeStyle = "#000000";
    ctx.beginPath();
    ctx.moveTo(pointA.x+dx, pointA.y+dy);
	ctx.lineTo(pointB.x+dx, pointB.y+dy);
    ctx.stroke();
	
	
	//Draw colored line on top of shadowed one
	ctx2.lineWidth = 5;
	ctx2.lineCap = "round";
	ctx2.lineJoin = "round";
	ctx2.miterLimit = 3;
	ctx2.strokeStyle = "#CAD208";
    ctx2.beginPath();
    ctx2.moveTo(pointA.x, pointA.y);
	ctx2.lineTo(pointB.x, pointB.y);
    ctx2.stroke();
}

function setFinishState()
{
	if (mState != STATE_FINISHED)
	{
		mState = STATE_FINISHED;
		createBoys();
		//createDisclaimer();
	}
}

function Point(_x,_y)
{
	this.x = _x;
	this.y = _y;
	
	this.clone = function()
	{
		return new Point(this.x,this.y);
	}
}

function normalizeSegments()
{
	// Changes the way points are stored
	// Go from: [A,B,C,null,D,E,F]
	// into: [a,b,d,e],   where a = segment from A to B,
	//							b = segment from B to C,
	//							d = segment from D to E,
	//							e = segment from E to F,
	//   also, each segment is stored as 2 consecutive points
	//   so the ending array would be:
	//    [A,B, B,C, D,E, E,F]
	
	var outList = new Array();
	
	for (var i = 1; i < mPoints.length; ++i)
	{
		if (mPoints[i] != NULL_POINT && mPoints[i-1] != NULL_POINT)
		{
			outList.push(mPoints[i-1].clone());
			outList.push(mPoints[i].clone());
		}
	}
	
	// Resulting vector will have an even quantity of elements
	mPoints = outList;
}

function randomizeSegments()
{
	var outList = new Array();
	
	while (mPoints.length > 0)
	{
		var index = Math.floor(Math.random()*mPoints.length); 
		if (index & 1 == 1)
		{
			//Odd number, make it even
			index--;
		}
		
		// Add the two elements from here
		outList.push(mPoints[index]);
		outList.push(mPoints[index + 1]);
		
		// Remove added elements
		mPoints.splice(index, 2);
	}
	
	mPoints = outList;
}

function createBoys()
{
	for (var i = 0; i < 7; i++)
	{
		var xPos = (i+1) * (canvas3.width / 9);
		var yPos = canvas3.height - 70 - 80;
		var boy = new Boy(i,xPos,yPos);
		mBoys.push(boy);
	}
}

function Boy(_id, _x, _y)
{
	this.id = _id;
	this.x = _x;
	this.y = _y;
	this.mAngle = 0;
	this.mAmplitude = 40 + Math.random() * 15;
	
	this.update = function(_elapsedTime)
	{
		this.mAngle += Math.PI * _elapsedTime;
		
		if (this.mAngle > Math.PI)
		{
			this.mAngle -= Math.PI;
			this.mAmplitude = 40 + Math.random() * 15;
			
			this.id++;
			if (this.id >= 7) {
				this.id = 0;
			}
		}
	}
	
	this.render = function(myCtx)
	{
		var posY = -Math.sin(this.mAngle) * this.mAmplitude;
		var vImage = gBoyImgs[this.id];
		myCtx.drawImage(vImage, this.x, this.y + posY);
	}
}

function definePoints()
{
//Begin drawing

//GLOBANT
mPoints.push(new Point(240, 176));
mPoints.push(new Point(176, 174));
mPoints.push(new Point(161, 178));
mPoints.push(new Point(149, 187));
mPoints.push(new Point(142, 200));
mPoints.push(new Point(142, 220));
mPoints.push(new Point(149, 233));
mPoints.push(new Point(161, 242));
mPoints.push(new Point(182, 245));
mPoints.push(new Point(240, 246));
mPoints.push(new Point(242, 204));
mPoints.push(new Point(188, 203));
mPoints.push(new Point(188, 214));
mPoints.push(new Point(217, 215));
mPoints.push(new Point(217, 231));
mPoints.push(new Point(179, 230));
mPoints.push(new Point(167, 218));
mPoints.push(new Point(167, 204));
mPoints.push(new Point(174, 192));
mPoints.push(new Point(189, 187));
mPoints.push(new Point(243, 186));
mPoints.push(new Point(241, 174));
mPoints.push(NULL_POINT);
mPoints.push(new Point(259, 175));
mPoints.push(new Point(259, 246));
mPoints.push(new Point(281, 246));
mPoints.push(new Point(282, 175));
mPoints.push(new Point(259, 175));
mPoints.push(NULL_POINT);
mPoints.push(new Point(323, 194));
mPoints.push(new Point(307, 197));
mPoints.push(new Point(298, 205));
mPoints.push(new Point(295, 215));
mPoints.push(new Point(294, 226));
mPoints.push(new Point(301, 237));
mPoints.push(new Point(314, 244));
mPoints.push(new Point(329, 246));
mPoints.push(new Point(352, 247));
mPoints.push(new Point(363, 243));
mPoints.push(new Point(375, 236));
mPoints.push(new Point(382, 224));
mPoints.push(new Point(380, 210));
mPoints.push(new Point(372, 201));
mPoints.push(new Point(356, 193));
mPoints.push(new Point(322, 193));
mPoints.push(NULL_POINT);
mPoints.push(new Point(395, 174));
mPoints.push(new Point(395, 245));
mPoints.push(new Point(443, 245));
mPoints.push(new Point(454, 243));
mPoints.push(new Point(469, 235));
mPoints.push(new Point(475, 227));
mPoints.push(new Point(476, 211));
mPoints.push(new Point(470, 203));
mPoints.push(new Point(459, 197));
mPoints.push(new Point(448, 194));
mPoints.push(new Point(416, 193));
mPoints.push(new Point(416, 175));
mPoints.push(new Point(395, 174));
mPoints.push(NULL_POINT);
mPoints.push(new Point(489, 193));
mPoints.push(new Point(490, 204));
mPoints.push(new Point(533, 204));
mPoints.push(new Point(539, 205));
mPoints.push(new Point(544, 207));
mPoints.push(new Point(544, 211));
mPoints.push(new Point(545, 214));
mPoints.push(new Point(509, 214));
mPoints.push(new Point(494, 216));
mPoints.push(new Point(487, 221));
mPoints.push(new Point(485, 228));
mPoints.push(new Point(486, 236));
mPoints.push(new Point(492, 241));
mPoints.push(new Point(503, 246));
mPoints.push(new Point(567, 246));
mPoints.push(new Point(567, 207));
mPoints.push(new Point(562, 200));
mPoints.push(new Point(551, 194));
mPoints.push(new Point(539, 193));
mPoints.push(new Point(489, 193));
mPoints.push(NULL_POINT);
mPoints.push(new Point(329, 205));
mPoints.push(new Point(320, 210));
mPoints.push(new Point(318, 220));
mPoints.push(new Point(320, 227));
mPoints.push(new Point(326, 233));
mPoints.push(new Point(339, 234));
mPoints.push(new Point(351, 232));
mPoints.push(new Point(358, 224));
mPoints.push(new Point(356, 213));
mPoints.push(new Point(349, 206));
mPoints.push(new Point(340, 204));
mPoints.push(new Point(330, 204));
mPoints.push(NULL_POINT);
mPoints.push(new Point(586, 244));
mPoints.push(new Point(587, 193));
mPoints.push(new Point(642, 194));
mPoints.push(new Point(654, 198));
mPoints.push(new Point(660, 205));
mPoints.push(new Point(660, 246));
mPoints.push(new Point(639, 245));
mPoints.push(new Point(639, 212));
mPoints.push(new Point(636, 206));
mPoints.push(new Point(631, 205));
mPoints.push(new Point(607, 205));
mPoints.push(new Point(607, 245));
mPoints.push(new Point(587, 246));
mPoints.push(NULL_POINT);
mPoints.push(new Point(686, 174));
mPoints.push(new Point(685, 192));
mPoints.push(new Point(670, 194));
mPoints.push(new Point(671, 202));
mPoints.push(new Point(684, 202));
mPoints.push(new Point(686, 228));
mPoints.push(new Point(686, 235));
mPoints.push(new Point(688, 241));
mPoints.push(new Point(694, 244));
mPoints.push(new Point(705, 246));
mPoints.push(new Point(728, 245));
mPoints.push(new Point(728, 234));
mPoints.push(new Point(715, 235));
mPoints.push(new Point(708, 231));
mPoints.push(new Point(707, 227));
mPoints.push(new Point(706, 204));
mPoints.push(new Point(728, 204));
mPoints.push(new Point(728, 194));
mPoints.push(new Point(707, 195));
mPoints.push(new Point(707, 174));
mPoints.push(new Point(685, 175));
mPoints.push(NULL_POINT);
mPoints.push(new Point(416, 204));
mPoints.push(new Point(416, 233));
mPoints.push(new Point(438, 234));
mPoints.push(new Point(448, 230));
mPoints.push(new Point(451, 220));
mPoints.push(new Point(449, 210));
mPoints.push(new Point(440, 203));
mPoints.push(new Point(416, 205));
mPoints.push(NULL_POINT);
mPoints.push(new Point(544, 224));
mPoints.push(new Point(543, 235));
mPoints.push(new Point(513, 235));
mPoints.push(new Point(507, 230));
mPoints.push(new Point(511, 225));
mPoints.push(new Point(524, 224));
mPoints.push(new Point(543, 225));

//Flechita arriba
mPoints.push(NULL_POINT);
mPoints.push(new Point(62, 152));
mPoints.push(new Point(92, 179));
mPoints.push(new Point(65, 202));
mPoints.push(new Point(60, 203));
mPoints.push(new Point(58, 203));
mPoints.push(new Point(57, 200));
mPoints.push(new Point(57, 196));
mPoints.push(new Point(62, 193));
mPoints.push(new Point(65, 188));
mPoints.push(new Point(68, 179));
mPoints.push(new Point(67, 170));
mPoints.push(new Point(62, 162));
mPoints.push(new Point(57, 157));
mPoints.push(new Point(57, 154));
mPoints.push(new Point(60, 151));
mPoints.push(new Point(63, 152));

//Flechita abajo
mPoints.push(NULL_POINT);
mPoints.push(new Point(62, 211));
mPoints.push(new Point(92, 238));
mPoints.push(new Point(65, 261));
mPoints.push(new Point(60, 262));
mPoints.push(new Point(58, 262));
mPoints.push(new Point(57, 259));
mPoints.push(new Point(57, 255));
mPoints.push(new Point(62, 252));
mPoints.push(new Point(65, 247));
mPoints.push(new Point(68, 238));
mPoints.push(new Point(67, 229));
mPoints.push(new Point(62, 221));
mPoints.push(new Point(57, 216));
mPoints.push(new Point(57, 213));
mPoints.push(new Point(60, 210));
mPoints.push(new Point(63, 211));

//Flechita derecha
mPoints.push(NULL_POINT);
mPoints.push(new Point(100, 183));
mPoints.push(new Point(130, 210));
mPoints.push(new Point(103, 233));
mPoints.push(new Point(98, 234));
mPoints.push(new Point(96, 234));
mPoints.push(new Point(95, 231));
mPoints.push(new Point(95, 227));
mPoints.push(new Point(100, 224));
mPoints.push(new Point(103, 219));
mPoints.push(new Point(106, 210));
mPoints.push(new Point(105, 201));
mPoints.push(new Point(100, 193));
mPoints.push(new Point(95, 188));
mPoints.push(new Point(95, 185));
mPoints.push(new Point(98, 182));
mPoints.push(new Point(101, 183));


//We are ready
mPoints.push(NULL_POINT);
mPoints.push(new Point(394, 271));
mPoints.push(new Point(400, 287));
mPoints.push(new Point(407, 272));
mPoints.push(new Point(413, 287));
mPoints.push(new Point(419, 271));
mPoints.push(NULL_POINT);
mPoints.push(new Point(436, 278));
mPoints.push(new Point(450, 279));
mPoints.push(new Point(449, 271));
mPoints.push(new Point(443, 271));
mPoints.push(new Point(437, 273));
mPoints.push(new Point(436, 279));
mPoints.push(new Point(438, 286));
mPoints.push(new Point(442, 289));
mPoints.push(new Point(448, 288));
mPoints.push(new Point(451, 285));
mPoints.push(NULL_POINT);
mPoints.push(new Point(488, 270));
mPoints.push(new Point(495, 269));
mPoints.push(new Point(500, 272));
mPoints.push(new Point(500, 289));
mPoints.push(NULL_POINT);
mPoints.push(new Point(500, 278));
mPoints.push(new Point(493, 277));
mPoints.push(new Point(488, 280));
mPoints.push(new Point(487, 285));
mPoints.push(new Point(490, 290));
mPoints.push(new Point(495, 289));
mPoints.push(new Point(500, 287));
mPoints.push(NULL_POINT);
mPoints.push(new Point(519, 270));
mPoints.push(new Point(520, 290));
mPoints.push(NULL_POINT);
mPoints.push(new Point(520, 272));
mPoints.push(new Point(526, 270));
mPoints.push(new Point(529, 273));
mPoints.push(NULL_POINT);
mPoints.push(new Point(542, 280));
mPoints.push(new Point(557, 279));
mPoints.push(new Point(556, 272));
mPoints.push(new Point(549, 271));
mPoints.push(new Point(543, 272));
mPoints.push(new Point(542, 278));
mPoints.push(new Point(544, 285));
mPoints.push(new Point(549, 288));
mPoints.push(new Point(555, 287));
mPoints.push(NULL_POINT);
mPoints.push(new Point(595, 285));
mPoints.push(new Point(595, 269));
mPoints.push(NULL_POINT);
mPoints.push(new Point(595, 277));
mPoints.push(new Point(601, 270));
mPoints.push(new Point(605, 270));
mPoints.push(NULL_POINT);
mPoints.push(new Point(618, 279));
mPoints.push(new Point(633, 279));
mPoints.push(new Point(630, 271));
mPoints.push(new Point(619, 271));
mPoints.push(new Point(617, 282));
mPoints.push(new Point(621, 287));
mPoints.push(new Point(627, 288));
mPoints.push(new Point(634, 285));
mPoints.push(NULL_POINT);
mPoints.push(new Point(649, 272));
mPoints.push(new Point(656, 271));
mPoints.push(new Point(663, 274));
mPoints.push(new Point(664, 290));
mPoints.push(NULL_POINT);
mPoints.push(new Point(662, 278));
mPoints.push(new Point(653, 279));
mPoints.push(new Point(650, 282));
mPoints.push(new Point(651, 288));
mPoints.push(new Point(659, 288));
mPoints.push(new Point(662, 285));
mPoints.push(NULL_POINT);
mPoints.push(new Point(695, 273));
mPoints.push(new Point(688, 271));
mPoints.push(new Point(679, 277));
mPoints.push(new Point(682, 286));
mPoints.push(new Point(689, 288));
mPoints.push(new Point(696, 283));
mPoints.push(NULL_POINT);
mPoints.push(new Point(695, 287));
mPoints.push(new Point(694, 261));
mPoints.push(NULL_POINT);
mPoints.push(new Point(714, 270));
mPoints.push(new Point(721, 287));
mPoints.push(new Point(727, 273));
mPoints.push(NULL_POINT);
mPoints.push(new Point(721, 286));
mPoints.push(new Point(720, 293));
mPoints.push(new Point(713, 299));

//End drawing

}