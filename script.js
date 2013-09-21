
$(document).ready(function(){

	// Access the canvas element
	var canvas=document.getElementById('game');
	var ctx=canvas.getContext('2d');

	// Canvas Width/Height Constants
	var WIDTH = 500
	var HEIGHT = 500

	canvas.width = WIDTH
	canvas.height = HEIGHT

	// Keep track of all the asteroids currently ingame
	var current_asteroids = []
	var max_asteroids = 5

	// Ship controlled by the player
	var ship = {
		direction_angle: 0,
		turn_angle: 0,
		turn_speed: 5,
		speed: 0,
		x: WIDTH/2,
		y: HEIGHT/2,
		max_speed: 5,
		shot_speed: 8,
		shots: [],
		max_shot_distance: WIDTH/4,
		alive: true,
	}

	// User input
	var input = {
		left: false,
		right: false,
		forward: false,
		fire: false,
	}

	asteroid_shapes = [
		[[-3,1],[-3,-1],[1,-3],[3,-1],[3,2],[1,3],[0,1],[0,3],[-3,2],[-1,1],[-3,1]],
		[[-2,-2],[-1,-3],[2,-3],[2,-2],[1,-1],[3,0],[3,2],[1,3],[0,2],[-2,3],[-3,0],[-2,0],[-2,-1]],
		[[-2,-2],[-1,-2],[0,-2],[1,-2],[3,-2],[2,0],[4,1],[2,3],[0,2],[-2,3],[-3,0],[-2,0],[-2,-2]]
	]
	
	// Constructor for a single shot object
	function shot(x,y,angle){
		this.x = x
		this.y = y
		this.angle = angle
		this.distance_traveled = 0
	}

	// Constructor for a single asteroid object
	function asteroid(x,y,speed,angle,size, shape){
		this.x = x
		this.y = y
		this.speed = speed
		this.angle = angle
		this.size = size
		this.shape = shape
	}

	function game_loop(){
		update_logic()
		draw()
	}

	function random(low,high){
		return Math.floor((Math.random()*high)+low);
	}

	function init(){
		for(var i = 0; i < max_asteroids; i++){
			add_asteroid();
		}
		setInterval(game_loop,20);
	}

	function add_asteroid(){
		// Keep the starting x and y away from the player starting position
		var x = (Math.random() > .5 ? 0 : (WIDTH/5)*3) + random(0,WIDTH/4)
		var y =  (Math.random() > .5 ? 0 : (HEIGHT/5)*3) + random(0,HEIGHT/4)
		var speed = random(2,3)
		var angle = random(0,360)
		var size = random(8,10)
		var shape = random(0,2);
		current_asteroids.push(new asteroid(x, y, speed, angle, size, shape))
	}

	function draw(){

		ctx.clearRect(0,0,WIDTH,HEIGHT)
		if(ship.alive)
			draw_ship()
		draw_shots()
		draw_asteroids()
		
	}

	function acceleration(speed){
		return Math.pow(ship.max_speed - ship.speed, 2) / 200
	}

	function break_asteroid(index){
		var x = current_asteroids[index].x
		var y = current_asteroids[index].y
		current_asteroids.splice(index,1)
		for(var i = 0; i < 3; i++){
			current_asteroids.push(new asteroid(x+Math.cos(i),y+Math.sin(i),(Math.random()*2)+1.75,random(0,360),2,random(0,2)))
		}

	}

	function update_ship_logic(){

	}

	function update_logic(){

		// Depending on the input, change the turn angle/speed of the ship
		if(input.left)
			ship.turn_angle = (ship.turn_angle - ship.turn_speed) % 360
		if(input.right)
			ship.turn_angle = (ship.turn_angle + ship.turn_speed) % 360
		if(input.forward){
			ship.speed += acceleration(ship.speed)
			ship.direction_angle = ship.turn_angle	
		}
		// The user has fired a shot
		if(input.fire){
			ship.shots.push(new shot(ship.x,ship.y,ship.turn_angle))
			input.fire = false
		}
		// Slightly decrease speed
		if(ship.speed > 0)
			ship.speed -= .01

		// Change the x and y location of the ship, taking into account direction angle and speed
		ship.y -= Math.cos(ship.direction_angle*Math.PI/180) * ship.speed
		ship.x += Math.sin(ship.direction_angle*Math.PI/180) * ship.speed
		
		// Check bounds, move ship to other side of canvas if out of bounds
		ship.x = ship.x > WIDTH ? 0 : ship.x < 0 ? WIDTH : ship.x
		ship.y = ship.y > HEIGHT ? 0 : ship.y < 0 ? HEIGHT : ship.y

		// Update each shot currently in play
		for(var i = 0; i < ship.shots.length; i++){
			// Update x and y coordinates
			ship.shots[i].y -= Math.cos(ship.shots[i].angle*Math.PI/180) * ship.shot_speed
			ship.shots[i].x += Math.sin(ship.shots[i].angle*Math.PI/180) * ship.shot_speed
			ship.shots[i].distance_traveled++
			// If the shot has reached the max distance, remove it from the shots array
			if(ship.shots[i].distance_traveled >= ship.max_shot_distance)
				ship.shots.splice(i,1)
		}

		// Update each asteroid location
		for(var i = 0; i < current_asteroids.length; i++){
			
			current = current_asteroids[i]

			current.y -= Math.cos(current.angle*Math.PI/180) * current.speed
			current.x -= Math.cos(current.angle*Math.PI/180) * current.speed

			// Check bounds
			current.y = current.y > HEIGHT + (5*current.size) ? (-5*current.size)+current.speed : current.y < (-5*current.size) ? HEIGHT+(5*current.size)-current.speed : current.y
			current.x = current.x > WIDTH + (5*current.size) ? (-5*current.size)+current.speed : current.x < (-5*current.size)  ? WIDTH+(5*current.size)-current.speed : current.x


			var distx = current.x - ship.x;
			var disty = current.y - ship.y;
			if(Math.sqrt((distx*distx) + (disty*disty)) < (5*current.size/2 + 3)){
				current_asteroids.splice(i,1)
				ship.alive = false
			}

			for(var j = 0; j < ship.shots.length; j++){
				distx = current.x - ship.shots[j].x;
				disty = current.y - ship.shots[j].y;
				if(Math.sqrt((distx*distx) + (disty*disty)) < (5*current.size/2)){
					current_asteroids.splice(i,1);
					ship.shots.splice(j,1)
					break;
				}
			}


		}

	}

	function draw_ship(){

		// Translate coordinates to ship's location so the ship rotates on its own axis
		ctx.translate(ship.x, ship.y)
		ctx.rotate(ship.turn_angle*Math.PI/180)
		ctx.translate(-ship.x, -ship.y)

		// Draw the ship
		ctx.beginPath()
		ctx.moveTo(ship.x, ship.y-12)
		ctx.lineTo(ship.x+8, ship.y+12)
		ctx.lineTo(ship.x-8, ship.y+12)
		ctx.lineTo(ship.x, ship.y-12)

		// Draw thrust if ship is moving
		if(input.forward == true && new Date().getTime() % 2 == 0){
			ctx.moveTo(ship.x-5,ship.y+12)
			ctx.lineTo(ship.x,ship.y+18)
			ctx.lineTo(ship.x+5,ship.y+12)
		}

		ctx.closePath()

		ctx.strokeStyle = '#FFF'
		ctx.fillStyle = '#000'
		ctx.fill()
		ctx.stroke()

		// Reset the angle of the canvas back to normal
		ctx.translate(ship.x, ship.y)
		ctx.rotate(-(ship.turn_angle*Math.PI/180))
		ctx.translate(-ship.x, -ship.y)
	}

	function draw_shots(){
		ctx.fillStyle = "#FFF"
		for(var i = 0; i < ship.shots.length; i++){
			ctx.fillRect(ship.shots[i].x,ship.shots[i].y,3,3)
		}
	}

	function draw_asteroids(){
		ctx.strokeStyle = '#FFF'
		ctx.fillStyle = 'red'
		for(var i = 0; i < current_asteroids.length; i++){
			var points = asteroid_shapes[current_asteroids[i].shape]
			var x = current_asteroids[i].x
			var y = current_asteroids[i].y
			var size = current_asteroids[i].size

			ctx.translate(current_asteroids[i].x, current_asteroids[i].y)
			ctx.rotate(current_asteroids[i].angle*Math.PI/180)
			ctx.translate(-current_asteroids[i].x, -current_asteroids[i].y)
			// ctx.fillStyle="blue"
			// ctx.fillRect(x,y,2,2);
			// ctx.beginPath()
			// ctx.arc(x,y,20*6/2,0,2*Math.PI)
			// ctx.closePath()
			// ctx.stroke()

			ctx.beginPath()
			ctx.moveTo((points[0][0]*size)+x,(points[0][1]*size)+y)
			for(var j = 0; j < points.length-1; j++){
				ctx.lineTo((points[j][0]*size)+x,(points[j][1]*size)+y)
			}

			ctx.closePath()
			ctx.stroke()
			//ctx.fill()


			ctx.translate(current_asteroids[i].x, current_asteroids[i].y)
			ctx.rotate(-(current_asteroids[i].angle*Math.PI/180))
			ctx.translate(-current_asteroids[i].x, -current_asteroids[i].y)

		}

	}

	init()

	$(document).keydown(function(evt) {
	  if (evt.keyCode == 37)
	  	input.left = true
	  if (evt.keyCode == 38)
	  	input.forward = true
	  if (evt.keyCode == 39)
	  	input.right = true 
	  if (evt.keyCode == 32)
	  	input.fire = true
    });         

	$(document).keyup(function(evt){
	  if (evt.keyCode == 37)
	  	input.left = false
	  if (evt.keyCode == 38)
	  	input.forward = false
	  if (evt.keyCode == 39)
	  	input.right = false 
	  if (evt.keyCode = 49)
	  	input.fire = false
	});


})

