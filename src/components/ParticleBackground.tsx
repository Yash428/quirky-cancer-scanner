
import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
}

const ParticleBackground = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Create initial particles
    const particleCount = window.innerWidth < 768 ? 20 : 40;
    const colors = ["#1EAEDB", "#33C3F0", "#8B5CF6", "#D946EF"];
    
    const newParticles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 4 + 4,
        speedX: (Math.random() - 0.3) * 0.7,
        speedY: (Math.random() - 0.3) * 0.7,
        opacity: Math.random() * 0.5 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    
    setParticles(newParticles);
    
    // Animation frame for particle movement
    let animationFrameId: number;
    let lastTime = 0;
    
    const animate = (time: number) => {
      // Only update every 60ms (for performance)
      if (time - lastTime > 60) {
        lastTime = time;
        setParticles((prevParticles) => 
          prevParticles.map((particle) => {
            // Update position
            let newX = particle.x + particle.speedX;
            let newY = particle.y + particle.speedY;
            
            // Bounce off edges
            if (newX <= 0 || newX >= window.innerWidth) {
              particle.speedX *= -1;
              newX = particle.x;
            }
            
            if (newY <= 0 || newY >= window.innerHeight) {
              particle.speedY *= -1;
              newY = particle.y;
            }
            
            return {
              ...particle,
              x: newX,
              y: newY,
            };
          })
        );
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return (
    <div className="particle-container fixed inset-0 w-full h-full pointer-events-none z-0">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle absolute"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            backgroundColor: particle.color,
          }}
        />
      ))}
    </div>
  );
};

export default ParticleBackground;
