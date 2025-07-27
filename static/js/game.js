class FlappyBird {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        
        this.gameState = 'start'; 
        this.score = 0;
        this.bestScore = localStorage.getItem('flappyBirdBest') || 0;
        
      
        this.images = {};
        this.imagesLoaded = 0;
        this.totalImages = 3;
        
        this.bird = {
            x: 100,
            y: 300,
            width: 30,
            height: 30,
            velocity: 0,
            gravity: 0.5,
            jumpStrength: -8,
            rotation: 0
        };
        
        this.pipes = [];
        this.pipeWidth = 52;
        this.pipeGap = 150;
        this.pipeSpeed = 2;
        
        
        this.groundHeight = 80;
        this.groundOffset = 0;
        
        
        this.backgroundOffset = 0;
        
        
        this.lastPipeTime = 0;
        this.pipeInterval = 1500; 
        
       
        this.animationId = null;
        this.lastTime = 0;
        
        this.loadImages();
    }
    
    loadImages() {
        const imageFiles = {
            bird: '/static/bird.png',
            background: '/static/background.png',
            pipe: '/static/pipe.png'
        };
        
        for (const [key, src] of Object.entries(imageFiles)) {
            const img = new Image();
            img.onload = () => {
                this.imagesLoaded++;
                if (this.imagesLoaded === this.totalImages) {
                    this.init();
                }
            };
            img.onerror = () => {
                console.error(`Failed to load image: ${src}`);
                this.imagesLoaded++;
                if (this.imagesLoaded === this.totalImages) {
                    this.init();
                }
            };
            img.src = src;
            this.images[key] = img;
        }
    }
    
    init() {
        this.setupEventListeners();
        this.updateUI();
        this.gameLoop();
        
       
        gameAudio.init();
        
        
        document.getElementById('bestScore').textContent = this.bestScore;
    }
    
    setupEventListeners() {
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleInput();
            }
        });
        
       
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleInput();
        });
        
        
        this.canvas.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleInput();
        });
        
        
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
    }
    
    handleInput() {
        if (this.gameState === 'playing') {
            this.flap();
        } else if (this.gameState === 'start') {
            this.startGame();
        } else if (this.gameState === 'gameOver') {
            this.restartGame();
        }
    }
    
    flap() {
        this.bird.velocity = this.bird.jumpStrength;
        gameAudio.resume().then(() => {
            gameAudio.playFlap();
        });
        
      
        this.canvas.classList.add('bounce');
        setTimeout(() => this.canvas.classList.remove('bounce'), 300);
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.bird.y = 300;
        this.bird.velocity = 0;
        this.pipes = [];
        this.lastPipeTime = Date.now();
        this.updateUI();
        
        gameAudio.resume();
    }
    
    restartGame() {
        this.startGame();
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
       
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('flappyBirdBest', this.bestScore);
        }
        
      
        gameAudio.playGameOver();
        
        
        this.canvas.classList.add('shake');
        setTimeout(() => this.canvas.classList.remove('shake'), 500);
        
        this.updateUI();
    }
    
    updateUI() {
        const startScreen = document.getElementById('startScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        const scoreDisplay = document.getElementById('scoreDisplay');
        const instructions = document.getElementById('instructions');
        
       
        startScreen.classList.add('d-none');
        gameOverScreen.classList.add('d-none');
        scoreDisplay.classList.add('d-none');
        instructions.classList.add('d-none');
        
        switch (this.gameState) {
            case 'start':
                startScreen.classList.remove('d-none');
                instructions.classList.remove('d-none');
                break;
            case 'playing':
                scoreDisplay.classList.remove('d-none');
                document.getElementById('currentScore').textContent = this.score;
                break;
            case 'gameOver':
                gameOverScreen.classList.remove('d-none');
                document.getElementById('finalScore').textContent = this.score;
                document.getElementById('bestScore').textContent = this.bestScore;
                break;
        }
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
      
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;
        
        
        this.bird.rotation = Math.max(-0.5, Math.min(0.5, this.bird.velocity * 0.05));
        
      
        const groundLevel = this.canvas.height - this.groundHeight;
        if (this.bird.y + this.bird.height >= groundLevel) {
            this.bird.y = groundLevel - this.bird.height;
            gameAudio.playHit();
            this.gameOver();
            return;
        }
        
       
        if (this.bird.y <= 0) {
            this.bird.y = 0;
            this.bird.velocity = 0;
        }
        
      
        this.backgroundOffset -= this.pipeSpeed * 0.5;
        if (this.backgroundOffset <= -this.canvas.width) {
            this.backgroundOffset = 0;
        }
        
      
        const now = Date.now();
        if (now - this.lastPipeTime > this.pipeInterval) {
            this.generatePipe();
            this.lastPipeTime = now;
        }
        
      
        this.updatePipes();
        
    
        this.checkCollisions();
    }
    
    generatePipe() {
        const minGapY = 100;
        const maxGapY = this.canvas.height - this.groundHeight - this.pipeGap - 100;
        const gapY = Math.random() * (maxGapY - minGapY) + minGapY;
        
        this.pipes.push({
            x: this.canvas.width,
            gapY: gapY,
            scored: false
        });
    }
    
    updatePipes() {
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= this.pipeSpeed;
            
          
            if (!pipe.scored && pipe.x + this.pipeWidth < this.bird.x) {
                pipe.scored = true;
                this.score++;
                gameAudio.playScore();
                document.getElementById('currentScore').textContent = this.score;
            }
            
           
            if (pipe.x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        const birdLeft = this.bird.x;
        const birdRight = this.bird.x + this.bird.width;
        const birdTop = this.bird.y;
        const birdBottom = this.bird.y + this.bird.height;
        
        for (const pipe of this.pipes) {
            const pipeLeft = pipe.x;
            const pipeRight = pipe.x + this.pipeWidth;
            
          
            if (birdRight > pipeLeft && birdLeft < pipeRight) {
                
                if (birdTop < pipe.gapY || birdBottom > pipe.gapY + this.pipeGap) {
                    gameAudio.playHit();
                    this.gameOver();
                    return;
                }
            }
        }
    }
    
    draw() {
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        
        this.drawBackground();
        
       
        this.drawPipes();
        
        
        this.drawBird();
    }
    
    drawBackground() {
        if (this.images.background && this.images.background.complete) {
          
            const bgWidth = this.images.background.width;
            const bgHeight = this.images.background.height;
            
           
            const scale = this.canvas.height / bgHeight;
            const scaledWidth = bgWidth * scale;
            
            
            for (let x = this.backgroundOffset; x < this.canvas.width + scaledWidth; x += scaledWidth) {
                this.ctx.drawImage(
                    this.images.background,
                    x, 0,
                    scaledWidth, this.canvas.height
                );
            }
        } else {
           
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#98FB98');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    drawPipes() {
        for (const pipe of this.pipes) {
            if (this.images.pipe && this.images.pipe.complete) {
                const pipeImg = this.images.pipe;
                
               
                this.ctx.save();
                this.ctx.translate(pipe.x + this.pipeWidth, pipe.gapY);
                this.ctx.scale(1, -1);
                this.ctx.drawImage(pipeImg, -this.pipeWidth, 0, this.pipeWidth, pipe.gapY);
                this.ctx.restore();
                
               
                this.ctx.drawImage(
                    pipeImg,
                    pipe.x, 
                    pipe.gapY + this.pipeGap,
                    this.pipeWidth,
                    this.canvas.height - pipe.gapY - this.pipeGap - this.groundHeight
                );
            } else {
               
                const gradient = this.ctx.createLinearGradient(pipe.x, 0, pipe.x + this.pipeWidth, 0);
                gradient.addColorStop(0, '#228B22');
                gradient.addColorStop(0.5, '#32CD32');
                gradient.addColorStop(1, '#228B22');
                
                this.ctx.fillStyle = gradient;
                
              
                this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.gapY);
                
               
                this.ctx.fillRect(
                    pipe.x, 
                    pipe.gapY + this.pipeGap, 
                    this.pipeWidth, 
                    this.canvas.height - pipe.gapY - this.pipeGap - this.groundHeight
                );
                
               
                this.ctx.fillStyle = '#1F5F1F';
                this.ctx.fillRect(pipe.x - 5, pipe.gapY - 20, this.pipeWidth + 10, 20);
                this.ctx.fillRect(pipe.x - 5, pipe.gapY + this.pipeGap, this.pipeWidth + 10, 20);
            }
        }
    }
    

    
    drawBird() {
        this.ctx.save();
        
        
        this.ctx.translate(this.bird.x + this.bird.width / 2, this.bird.y + this.bird.height / 2);
        this.ctx.rotate(this.bird.rotation);
        
        if (this.images.bird && this.images.bird.complete) {
           
            this.ctx.drawImage(
                this.images.bird,
                -this.bird.width / 2,
                -this.bird.height / 2,
                this.bird.width,
                this.bird.height
            );
        } else {
           
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, this.bird.width / 2, this.bird.height / 2, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            
            this.ctx.fillStyle = '#FFA500';
            this.ctx.beginPath();
            this.ctx.ellipse(-5, -5, 8, 6, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
        
            this.ctx.fillStyle = '#FF4500';
            this.ctx.beginPath();
            this.ctx.moveTo(this.bird.width / 2 - 5, -2);
            this.ctx.lineTo(this.bird.width / 2 + 5, 0);
            this.ctx.lineTo(this.bird.width / 2 - 5, 2);
            this.ctx.closePath();
            this.ctx.fill();
            
      
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(3, -5, 6, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.arc(3, -5, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.draw();
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}


document.addEventListener('DOMContentLoaded', () => {
    window.game = new FlappyBird();
});


document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (gameAudio.audioContext) {
            gameAudio.audioContext.suspend();
        }
    } else {
        if (gameAudio.audioContext) {
            gameAudio.audioContext.resume();
        }
    }
});
