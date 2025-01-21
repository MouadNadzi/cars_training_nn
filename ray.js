


// Pour le raycasting, voir vidéo de Daniel Shiffman
// sur le sujet : https://www.youtube.com/watch?v=TOEi6T2mtHo
class Ray {
    constructor(pos, angle) {
      //this.pos = pos;
      this.pos = pos ? pos.copy() : createVector(0, 0);

      this.baseAngle = angle; // Store the base angle

      this.angle = angle;
      this.dir = p5.Vector.fromAngle(angle);
    }

    rotate(vehicleHeading) {
      // Rotate ray relative to vehicle heading
      try {
        this.angle = this.baseAngle + vehicleHeading;
        this.dir = p5.Vector.fromAngle(this.angle);
      } catch (error) {
          console.error('Error rotating ray:', error);
      }
  }
  
    // On regarde dans une direction donnée
    lookAt(x, y) {
      this.dir.x = x - this.pos.x;
      this.dir.y = y - this.pos.y;
      this.dir.normalize();
    }
  
    rotate(offset) {
      this.dir = p5.Vector.fromAngle(this.angle + offset);
    }
  
    // On dessine le rayon
    show() {
      try {
        if (!this.pos || !this.dir) return;
        
        stroke(0, 255, 0, 100);
        push();
        translate(this.pos.x, this.pos.y);
        line(0, 0, this.dir.x * SIGHT, this.dir.y * SIGHT);
        pop();
      } catch (error) {
          console.error('Error showing ray:', error);
      }
    }
  
    // On regarde si le rayon intersecte un mur
    // si oui on renvoie le point d'intersection
    
      cast(wall) {
        try {
            if (!wall || !wall.a || !wall.b) return;
            
            const x1 = wall.a.x;
            const y1 = wall.a.y;
            const x2 = wall.b.x;
            const y2 = wall.b.y;
            
            const x3 = this.pos.x;
            const y3 = this.pos.y;
            const x4 = this.pos.x + this.dir.x;
            const y4 = this.pos.y + this.dir.y;
            
            const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
            if (den == 0) return;
            
            const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
            const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
            
            if (t > 0 && t < 1 && u > 0) {
                const pt = createVector();
                pt.x = x1 + t * (x2 - x1);
                pt.y = y1 + t * (y2 - y1);
                return pt;
            }
        } catch (error) {
            console.error('Error in ray casting:', error);
        }
        return;
    }

  }