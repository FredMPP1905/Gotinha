"use client"

import { useEffect, useRef, useState } from "react"
import type { HTMLImageElement } from "react"

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600
const GRAVITY = 0.5
const JUMP_FORCE = -12
const LEVEL_WIDTH = 9000

interface Player {
  x: number
  y: number
  width: number
  height: number
  velocityX: number
  velocityY: number
  onGround: boolean
  direction: number
  isJumping: boolean
  isShooting: boolean
  shootTimer: number
  lives: number
  invulnerable: boolean
  invulnerabilityTimer: number
}

interface Enemy {
  x: number
  y: number
  width: number
  height: number
  velocityX: number
  direction: number
}

interface Projectile {
  x: number
  y: number
  width: number
  height: number
  velocityX: number
  velocityY: number
  rotation: number
  scale: number
  trail: { x: number; y: number; alpha: number }[]
}

interface Platform {
  x: number
  y: number
  width: number
  height: number
}

interface IceSpike {
  x: number
  y: number
  width: number
  height: number
  isVictory?: boolean
}

interface SunOrb {
  x: number
  y: number
  collected: boolean
}

export default function DropletGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<"playing" | "gameOver" | "victory">("playing")
  const [score, setScore] = useState(0)
  const backgroundImageRef = useRef<HTMLImageElement | null>(null)
  const cloudPlatformImageRef = useRef<HTMLImageElement | null>(null)
  const wideCloudGroundImageRef = useRef<HTMLImageElement | null>(null)
  const [camera, setCamera] = useState({ x: 0, y: 0 })

  const [player, setPlayer] = useState<Player>({
    x: 50,
    y: 300,
    width: 30,
    height: 40,
    velocityX: 0,
    velocityY: 0,
    onGround: false,
    direction: 1,
    isJumping: false,
    isShooting: false,
    shootTimer: 0,
    lives: 3,
    invulnerable: false,
    invulnerabilityTimer: 0,
  })

  const platforms: Platform[] = [
    { x: 0, y: 400, width: 200, height: 20 },
    { x: 600, y: 350, width: 150, height: 20 },
    { x: 1200, y: 300, width: 200, height: 20 },
    { x: 1800, y: 250, width: 150, height: 20 },
    { x: 2400, y: 200, width: 200, height: 20 },
    { x: 3000, y: 150, width: 150, height: 20 },
    { x: 3600, y: 100, width: 200, height: 20 },
    { x: 4200, y: 50, width: 150, height: 20 },
    { x: 4800, y: 100, width: 200, height: 20 },
    { x: 5400, y: 150, width: 150, height: 20 },
    { x: 6000, y: 200, width: 200, height: 20 },
    { x: 6600, y: 250, width: 150, height: 20 },
    { x: 7200, y: 300, width: 200, height: 20 },
    { x: 7800, y: 350, width: 150, height: 20 },
    { x: 8400, y: 400, width: 200, height: 20 },
    // Vertical platforms for climbing - mais espalhadas
    { x: 900, y: 180, width: 100, height: 20 },
    { x: 1500, y: 130, width: 80, height: 20 },
    { x: 2100, y: 80, width: 120, height: 20 },
    { x: 2700, y: 30, width: 100, height: 20 },
    { x: 3300, y: 20, width: 90, height: 20 },
    { x: 3900, y: 30, width: 110, height: 20 },
    { x: 4500, y: 80, width: 100, height: 20 },
    { x: 5100, y: 130, width: 120, height: 20 },
    { x: 5700, y: 180, width: 100, height: 20 },
    { x: 6300, y: 230, width: 150, height: 20 },
    { x: 6900, y: 280, width: 100, height: 20 },
    { x: 7500, y: 330, width: 120, height: 20 },
    { x: 0, y: 450, width: LEVEL_WIDTH, height: 100 }, // Ground - estendido
  ]

  const [enemies, setEnemies] = useState<Enemy[]>([
    { x: 500, y: 320, width: 40, height: 30, velocityX: -1, direction: -1 },
    { x: 1200, y: 270, width: 40, height: 30, velocityX: 1, direction: 1 },
    { x: 2000, y: 120, width: 40, height: 30, velocityX: -1, direction: -1 },
    { x: 2800, y: 20, width: 40, height: 30, velocityX: 1, direction: 1 },
    { x: 3600, y: 70, width: 40, height: 30, velocityX: -1, direction: -1 },
    { x: 4400, y: 220, width: 40, height: 30, velocityX: 1, direction: 1 },
    { x: 5200, y: 320, width: 40, height: 30, velocityX: -1, direction: -1 },
  ])

  const iceSpikes: IceSpike[] = [
    { x: 300, y: 460, width: 30, height: 40 },
    { x: 800, y: 460, width: 30, height: 40 },
    { x: 1300, y: 460, width: 30, height: 40 },
    { x: 1800, y: 460, width: 30, height: 40 },
    { x: 2200, y: 460, width: 30, height: 40 },
    { x: 2600, y: 460, width: 30, height: 40 },
    { x: 3000, y: 460, width: 30, height: 40 },
    { x: 3400, y: 460, width: 30, height: 40 },
    { x: 3800, y: 460, width: 30, height: 40 },
    { x: 4200, y: 460, width: 30, height: 40 },
    { x: 4600, y: 460, width: 30, height: 40 },
    { x: 5000, y: 460, width: 30, height: 40 },
    { x: 5400, y: 460, width: 30, height: 40 },
    { x: 5800, y: 460, width: 50, height: 40, isVictory: true }, // Victory portal
  ]

  const [projectiles, setProjectiles] = useState<Projectile[]>([])
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({})
  const [sunOrbs, setSunOrbs] = useState<Array<{ x: number; y: number; collected: boolean }>>([])

  const checkCollision = (rect1: any, rect2: any): boolean => {
    if (!rect1 || !rect2) return false
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    )
  }

  const updateGame = () => {
    if (gameState !== "playing") return

    setPlayer((prevPlayer) => {
      const newPlayer = { ...prevPlayer }

      // Handle invulnerability
      if (newPlayer.invulnerable) {
        newPlayer.invulnerabilityTimer -= 16
        if (newPlayer.invulnerabilityTimer <= 0) {
          newPlayer.invulnerable = false
        }
      }

      // Handle shooting animation
      if (newPlayer.isShooting) {
        newPlayer.shootTimer -= 16
        if (newPlayer.shootTimer <= 0) {
          newPlayer.isShooting = false
        }
      }

      // Handle input
      if (keys["ArrowLeft"] || keys["a"] || keys["A"]) {
        newPlayer.velocityX = -7
        newPlayer.direction = -1
      } else if (keys["ArrowRight"] || keys["d"] || keys["D"]) {
        newPlayer.velocityX = 7
        newPlayer.direction = 1
      } else {
        newPlayer.velocityX = 0
      }

      if ((keys["ArrowUp"] || keys["w"] || keys["W"]) && newPlayer.onGround) {
        newPlayer.velocityY = JUMP_FORCE
        newPlayer.onGround = false
        newPlayer.isJumping = true
      }

      if (keys[" "] || keys["Space"]) {
        if (!newPlayer.isShooting) {
          // Create projectile
          const projectile: Projectile = {
            x: newPlayer.x + (newPlayer.direction > 0 ? newPlayer.width : 0),
            y: newPlayer.y + newPlayer.height / 2,
            width: 8,
            height: 8,
            velocityX: newPlayer.direction * 6,
            velocityY: 0, // Changed from -2 to 0 for straight shooting
            rotation: 0,
            scale: 1,
            trail: [],
          }

          setProjectiles((prev) => [...prev, projectile])
          newPlayer.isShooting = true
          newPlayer.shootTimer = 300
        }
      }

      // Apply gravity
      newPlayer.velocityY += GRAVITY
      newPlayer.x += newPlayer.velocityX
      newPlayer.y += newPlayer.velocityY

      // Check ground collision
      newPlayer.onGround = false
      platforms.forEach((platform) => {
        if (checkCollision(newPlayer, platform) && newPlayer.velocityY > 0) {
          newPlayer.y = platform.y - newPlayer.height
          newPlayer.velocityY = 0
          newPlayer.onGround = true
          newPlayer.isJumping = false
        }
      })

      // Check boundaries
      if (newPlayer.x < 0) newPlayer.x = 0
      if (newPlayer.x + newPlayer.width > LEVEL_WIDTH) newPlayer.x = LEVEL_WIDTH - newPlayer.width
      if (newPlayer.y > CANVAS_HEIGHT) {
        // Reset to start
        newPlayer.x = 50
        newPlayer.y = 300
        newPlayer.velocityX = 0
        newPlayer.velocityY = 0
        if (!newPlayer.invulnerable) {
          newPlayer.lives -= 1
          newPlayer.invulnerable = true
          newPlayer.invulnerabilityTimer = 2000
          if (newPlayer.lives <= 0) {
            setGameState("gameOver")
          }
        }
      }

      // Check enemy collisions
      enemies.forEach((enemy) => {
        if (checkCollision(newPlayer, enemy) && !newPlayer.invulnerable) {
          newPlayer.lives -= 1
          newPlayer.invulnerable = true
          newPlayer.invulnerabilityTimer = 2000
          // Reset to start
          newPlayer.x = 50
          newPlayer.y = 300
          newPlayer.velocityX = 0
          newPlayer.velocityY = 0
          if (newPlayer.lives <= 0) {
            setGameState("gameOver")
          }
        }
      })

      // Check ice spike collisions
      iceSpikes.forEach((spike) => {
        if (checkCollision(newPlayer, spike) && !newPlayer.invulnerable) {
          if (spike.isVictory) {
            setGameState("victory")
          } else {
            newPlayer.lives -= 1
            newPlayer.invulnerable = true
            newPlayer.invulnerabilityTimer = 2000
            // Reset to start
            newPlayer.x = 50
            newPlayer.y = 300
            newPlayer.velocityX = 0
            newPlayer.velocityY = 0
            if (newPlayer.lives <= 0) {
              setGameState("gameOver")
            }
          }
        }
      })

      setSunOrbs((prev) =>
        prev.map((orb) => {
          if (!orb.collected && checkCollision(newPlayer, { x: orb.x, y: orb.y, width: 20, height: 20 })) {
            setScore((prevScore) => prevScore + 10)
            return { ...orb, collected: true }
          }
          return orb
        }),
      )

      return newPlayer
    })

    setCamera((prevCamera) => {
      const targetX = player.x - CANVAS_WIDTH / 2
      const targetY = player.y - CANVAS_HEIGHT / 2

      // Smooth camera movement with lerp
      const lerpFactor = 0.1
      const newCameraX = prevCamera.x + (targetX - prevCamera.x) * lerpFactor
      const newCameraY = prevCamera.y + (targetY - prevCamera.y) * lerpFactor

      // Clamp camera to level boundaries
      const clampedX = Math.max(0, Math.min(LEVEL_WIDTH - CANVAS_WIDTH, newCameraX))
      const clampedY = Math.max(-200, Math.min(200, newCameraY))

      return { x: clampedX, y: clampedY }
    })

    // Update projectiles
    setProjectiles((prev) => {
      return prev
        .map((projectile) => {
          // Add trail point
          projectile.trail.unshift({ x: projectile.x, y: projectile.y, alpha: 1 })
          if (projectile.trail.length > 8) {
            projectile.trail.pop()
          }

          // Update trail alpha
          projectile.trail.forEach((point, index) => {
            point.alpha = 1 - index / projectile.trail.length
          })

          projectile.x += projectile.velocityX
          projectile.y += projectile.velocityY
          projectile.rotation += 0.2
          projectile.scale = 1 + Math.sin(Date.now() * 0.01) * 0.2

          return projectile
        })
        .filter(
          (projectile) =>
            projectile.x > -50 &&
            projectile.x < LEVEL_WIDTH + 50 &&
            projectile.y > -50 &&
            projectile.y < CANVAS_HEIGHT + 50,
        )
    })

    // Update enemies
    setEnemies((prev) => {
      return prev
        .map((enemy) => {
          enemy.x += enemy.velocityX

          // Simple AI: reverse direction at platform edges
          const currentPlatform = platforms.find(
            (platform) =>
              enemy.x + enemy.width > platform.x &&
              enemy.x < platform.x + platform.width &&
              Math.abs(enemy.y + enemy.height - platform.y) < 5,
          )

          if (currentPlatform) {
            if (enemy.x <= currentPlatform.x || enemy.x + enemy.width >= currentPlatform.x + currentPlatform.width) {
              enemy.velocityX *= -1
              enemy.direction *= -1
            }
          }

          return enemy
        })
        .filter((enemy) => {
          // Check if hit by projectile
          const hit = projectiles.some((projectile) => checkCollision(enemy, projectile))
          if (hit) {
            setScore((prev) => prev + 25) // Changed from 100 to 25 points for killing smoke enemies
            // Remove projectiles that hit
            setProjectiles((prev) => prev.filter((projectile) => !checkCollision(enemy, projectile)))
          }
          return !hit
        })
    })
  }

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    if (backgroundImageRef.current) {
      const pattern = ctx.createPattern(backgroundImageRef.current, "repeat")
      if (pattern) {
        ctx.fillStyle = pattern
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      }
    } else {
      // Fallback gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
      gradient.addColorStop(0, "#87CEEB")
      gradient.addColorStop(1, "#E0F6FF")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    }
  }

  const drawGround = (ctx: CanvasRenderingContext2D) => {
    const groundPlatform = platforms.find((p) => p.y === 450)
    if (!groundPlatform) return

    const groundX = groundPlatform.x - camera.x
    const groundY = groundPlatform.y - camera.y

    // Creating solid white ground base
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(groundX, groundY, LEVEL_WIDTH, groundPlatform.height)

    // Add subtle shadows for depth
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
    ctx.fillRect(groundX, groundY + groundPlatform.height - 3, LEVEL_WIDTH, 3)
  }

  const drawPlatforms = (ctx: CanvasRenderingContext2D) => {
    platforms.forEach((platform) => {
      if (platform.y === 450) return // Skip ground platform

      const platformX = platform.x - camera.x
      const platformY = platform.y - camera.y

      // Only draw if platform is visible on screen
      if (platformX + platform.width > -50 && platformX < CANVAS_WIDTH + 50) {
        // White base with cloud details
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(platformX, platformY, platform.width, platform.height)

        // Add cloud details
        ctx.fillStyle = "rgba(173, 216, 230, 0.6)"
        for (let x = 0; x < platform.width; x += 40) {
          const cloudX = platformX + x
          const cloudY = platformY + 5
          ctx.beginPath()
          ctx.arc(cloudX, cloudY, 8, 0, Math.PI * 2)
          ctx.arc(cloudX + 15, cloudY, 12, 0, Math.PI * 2)
          ctx.arc(cloudX + 25, cloudY, 8, 0, Math.PI * 2)
          ctx.fill()
        }

        // Add subtle shadows and highlights
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
        ctx.fillRect(platformX, platformY + platform.height - 2, platform.width, 2)

        ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
        ctx.fillRect(platformX, platformY, platform.width, 2)
      }
    })
  }

  const drawPlayer = (ctx: CanvasRenderingContext2D) => {
    const time = Date.now() * 0.01

    const playerX = player.x - camera.x
    const playerY = player.y - camera.y

    // Invulnerability flashing effect
    if (player.invulnerable && Math.floor(Date.now() / 100) % 2) {
      ctx.globalAlpha = 0.5
    }

    ctx.save()
    ctx.translate(playerX + player.width / 2, playerY + player.height / 2)

    // Main droplet body with more realistic water gradient
    const gradient = ctx.createRadialGradient(0, -8, 3, 0, 0, player.width / 2)
    gradient.addColorStop(0, "#FFFFFF")
    gradient.addColorStop(0.2, "#E6F7FF")
    gradient.addColorStop(0.5, "#B3E5FF")
    gradient.addColorStop(0.8, "#66D9FF")
    gradient.addColorStop(1, "#1890FF")

    // More teardrop-like shape
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.moveTo(0, -player.height / 2) // Top point
    ctx.quadraticCurveTo(player.width / 2, -player.height / 4, player.width / 2, player.height / 4)
    ctx.quadraticCurveTo(player.width / 2, player.height / 2, 0, player.height / 2)
    ctx.quadraticCurveTo(-player.width / 2, player.height / 2, -player.width / 2, player.height / 4)
    ctx.quadraticCurveTo(-player.width / 2, -player.height / 4, 0, -player.height / 2)
    ctx.fill()

    // Water shine effect
    const shineGradient = ctx.createLinearGradient(
      -player.width / 4,
      -player.height / 3,
      player.width / 4,
      player.height / 3,
    )
    shineGradient.addColorStop(0, "rgba(255, 255, 255, 0.8)")
    shineGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.3)")
    shineGradient.addColorStop(1, "rgba(255, 255, 255, 0)")

    ctx.fillStyle = shineGradient
    ctx.beginPath()
    ctx.ellipse(-player.width / 6, -player.height / 4, player.width / 6, player.height / 4, 0, 0, Math.PI * 2)
    ctx.fill()

    // Eyes - more expressive
    const eyeOffset = player.direction > 0 ? 2 : -2
    const blinkTime = Math.sin(time * 0.1) > 0.95 ? 1 : 3

    ctx.fillStyle = "#000000"
    ctx.beginPath()
    ctx.arc(-5 + eyeOffset, -5, blinkTime, 0, Math.PI * 2)
    ctx.arc(5 + eyeOffset, -5, blinkTime, 0, Math.PI * 2)
    ctx.fill()

    // Eye shine
    ctx.fillStyle = "#FFFFFF"
    ctx.beginPath()
    ctx.arc(-4 + eyeOffset, -6, 1, 0, Math.PI * 2)
    ctx.arc(6 + eyeOffset, -6, 1, 0, Math.PI * 2)
    ctx.fill()

    // Mouth
    if (player.isShooting) {
      ctx.fillStyle = "#000000"
      ctx.beginPath()
      ctx.arc(player.direction * 8, 2, 4, 0, Math.PI * 2)
      ctx.fill()
    } else if (player.velocityX !== 0) {
      ctx.strokeStyle = "#000000"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 5, 3, 0, Math.PI)
      ctx.stroke()
    } else {
      ctx.fillStyle = "#000000"
      ctx.beginPath()
      ctx.arc(0, 5, 1, 0, Math.PI * 2)
      ctx.fill()
    }

    // Blush when moving
    if (player.velocityX !== 0) {
      ctx.fillStyle = "rgba(255, 182, 193, 0.6)"
      ctx.beginPath()
      ctx.arc(-8, 2, 3, 0, Math.PI * 2)
      ctx.arc(8, 2, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    // Shine effect
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)"
    ctx.beginPath()
    ctx.arc(-3, -8, 4, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
    ctx.globalAlpha = 1
  }

  const drawEnemy = (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
    const time = Date.now() * 0.005

    const enemyX = enemy.x - camera.x
    const enemyY = enemy.y - camera.y

    // Only draw if enemy is visible on screen
    if (enemyX + enemy.width > -50 && enemyX < CANVAS_WIDTH + 50) {
      ctx.save()
      ctx.translate(enemyX + enemy.width / 2, enemyY + enemy.height / 2)

      // Multiple smoke layers for depth
      const layers = [
        { color: "#4A4A4A", size: 1.0, offset: 0 },
        { color: "#2C2C2C", size: 0.8, offset: 2 },
        { color: "#1A1A1A", size: 0.6, offset: 4 },
      ]

      layers.forEach((layer, index) => {
        ctx.fillStyle = layer.color
        const waveOffset = Math.sin(time + index) * 3

        // Main smoke body
        ctx.beginPath()
        ctx.arc(layer.offset + waveOffset, 0, (enemy.width / 2) * layer.size, 0, Math.PI * 2)
        ctx.fill()

        // Wispy edges
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2
          const wispX = Math.cos(angle) * (enemy.width / 2 + 5) * layer.size + layer.offset + waveOffset
          const wispY = Math.sin(angle) * (enemy.height / 2 + 3) * layer.size
          ctx.beginPath()
          ctx.arc(wispX, wispY, 3 * layer.size, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      // Evil eyes
      ctx.fillStyle = "#FF0000"
      ctx.beginPath()
      ctx.arc(-8, -5, 3, 0, Math.PI * 2)
      ctx.arc(8, -5, 3, 0, Math.PI * 2)
      ctx.fill()

      // Eye pupils
      ctx.fillStyle = "#FFFF00"
      ctx.beginPath()
      ctx.arc(-8, -5, 1, 0, Math.PI * 2)
      ctx.arc(8, -5, 1, 0, Math.PI * 2)
      ctx.fill()

      // Angry eyebrows
      ctx.strokeStyle = "#8B0000"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(-12, -10)
      ctx.lineTo(-4, -8)
      ctx.moveTo(4, -8)
      ctx.lineTo(12, -10)
      ctx.stroke()

      // Evil grin
      ctx.strokeStyle = "#8B0000"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 5, 8, 0.2, Math.PI - 0.2)
      ctx.stroke()

      // Sharp teeth
      ctx.fillStyle = "#FFFFFF"
      for (let i = 0; i < 5; i++) {
        const toothX = -6 + i * 3
        ctx.beginPath()
        ctx.moveTo(toothX, 3)
        ctx.lineTo(toothX + 1, 7)
        ctx.lineTo(toothX + 2, 3)
        ctx.fill()
      }

      ctx.restore()
    }
  }

  const drawProjectiles = (ctx: CanvasRenderingContext2D) => {
    projectiles.forEach((projectile) => {
      const projX = projectile.x - camera.x
      const projY = projectile.y - camera.y

      // Only draw if projectile is visible on screen
      if (projX > -50 && projX < CANVAS_WIDTH + 50) {
        // Draw trail
        projectile.trail.forEach((point, index) => {
          const trailX = point.x - camera.x
          const trailY = point.y - camera.y
          ctx.save()
          ctx.globalAlpha = point.alpha * 0.6
          ctx.fillStyle = "#4DA6FF"
          ctx.beginPath()
          ctx.arc(trailX, trailY, 3 * (1 - index / projectile.trail.length), 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        })

        // Draw main projectile
        ctx.save()
        ctx.translate(projX + projectile.width / 2, projY + projectile.height / 2)
        ctx.rotate(projectile.rotation)
        ctx.scale(projectile.scale, projectile.scale)

        // Multiple gradient layers
        const gradient1 = ctx.createRadialGradient(0, 0, 0, 0, 0, projectile.width / 2)
        gradient1.addColorStop(0, "#FFFFFF")
        gradient1.addColorStop(0.3, "#E6F3FF")
        gradient1.addColorStop(0.7, "#4DA6FF")
        gradient1.addColorStop(1, "#0066CC")

        ctx.fillStyle = gradient1
        ctx.beginPath()
        ctx.arc(0, 0, projectile.width / 2, 0, Math.PI * 2)
        ctx.fill()

        // Inner shine
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
        ctx.beginPath()
        ctx.arc(-1, -1, projectile.width / 4, 0, Math.PI * 2)
        ctx.fill()

        // Sparkle effects
        const sparkles = 4
        for (let i = 0; i < sparkles; i++) {
          const angle = (i / sparkles) * Math.PI * 2 + projectile.rotation
          const sparkleX = Math.cos(angle) * (projectile.width / 2 + 3)
          const sparkleY = Math.sin(angle) * (projectile.width / 2 + 3)

          ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
          ctx.beginPath()
          ctx.arc(sparkleX, sparkleY, 1, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()
      }
    })
  }

  const drawIceSpikes = (ctx: CanvasRenderingContext2D) => {
    iceSpikes.forEach((spike) => {
      const spikeX = spike.x - camera.x
      const spikeY = spike.y - camera.y

      // Only draw if spike is visible on screen
      if (spikeX + spike.width > -50 && spikeX < CANVAS_WIDTH + 50) {
        if (spike.isVictory) {
          // Victory portal
          const time = Date.now() * 0.005

          ctx.save()
          ctx.translate(spikeX + spike.width / 2, spikeY + spike.height / 2)

          // Outer glow
          const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, spike.width)
          glowGradient.addColorStop(0, "rgba(255, 215, 0, 0.8)")
          glowGradient.addColorStop(0.5, "rgba(255, 215, 0, 0.4)")
          glowGradient.addColorStop(1, "rgba(255, 215, 0, 0)")
          ctx.fillStyle = glowGradient
          ctx.beginPath()
          ctx.arc(0, 0, spike.width, 0, Math.PI * 2)
          ctx.fill()

          // Main portal body
          const portalGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, spike.width / 2)
          portalGradient.addColorStop(0, "#FFD700")
          portalGradient.addColorStop(0.7, "#FFA500")
          portalGradient.addColorStop(1, "#FF8C00")
          ctx.fillStyle = portalGradient
          ctx.beginPath()
          ctx.arc(0, 0, spike.width / 2, 0, Math.PI * 2)
          ctx.fill()

          // Rotating rings
          for (let ring = 0; ring < 3; ring++) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 - ring * 0.2})`
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.arc(0, 0, spike.width / 2 - ring * 5, time + ring, time + ring + Math.PI)
            ctx.stroke()
          }

          // Swirling effect
          ctx.strokeStyle = "rgba(255, 255, 255, 0.6)"
          ctx.lineWidth = 1
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + time
            const innerRadius = 5
            const outerRadius = spike.width / 2 - 5
            ctx.beginPath()
            ctx.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius)
            ctx.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius)
            ctx.stroke()
          }

          // Sparkles
          for (let i = 0; i < 12; i++) {
            const sparkleAngle = (i / 12) * Math.PI * 2 + time * 2
            const sparkleRadius = spike.width / 2 + 10 + Math.sin(time * 3 + i) * 5
            const sparkleX = Math.cos(sparkleAngle) * sparkleRadius
            const sparkleY = Math.sin(sparkleAngle) * sparkleRadius

            ctx.fillStyle = `rgba(255, 255, 255, ${0.8 + Math.sin(time * 4 + i) * 0.2})`
            ctx.beginPath()
            ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2)
            ctx.fill()
          }

          ctx.restore()
        } else {
          // Regular ice spike
          ctx.save()
          ctx.translate(spikeX + spike.width / 2, spikeY + spike.height)

          // Multiple ice layers for depth
          const iceGradient1 = ctx.createLinearGradient(0, -spike.height, 0, 0)
          iceGradient1.addColorStop(0, "#E6F3FF")
          iceGradient1.addColorStop(0.3, "#B3D9FF")
          iceGradient1.addColorStop(0.7, "#80C7FF")
          iceGradient1.addColorStop(1, "#4DA6FF")

          ctx.fillStyle = iceGradient1
          ctx.beginPath()
          ctx.moveTo(0, -spike.height)
          ctx.lineTo(-spike.width / 2, 0)
          ctx.lineTo(spike.width / 2, 0)
          ctx.closePath()
          ctx.fill()

          // Ice crystals
          ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
          for (let i = 0; i < 5; i++) {
            const crystalX = (Math.random() - 0.5) * spike.width * 0.6
            const crystalY = -Math.random() * spike.height * 0.8
            ctx.beginPath()
            ctx.arc(crystalX, crystalY, 2, 0, Math.PI * 2)
            ctx.fill()
          }

          // Highlight edge
          ctx.strokeStyle = "rgba(255, 255, 255, 0.9)"
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(-2, -spike.height + 2)
          ctx.lineTo(-spike.width / 2 + 3, -3)
          ctx.stroke()

          // Frost at base
          ctx.fillStyle = "rgba(173, 216, 230, 0.6)"
          ctx.beginPath()
          ctx.ellipse(0, 0, spike.width / 2 + 5, 8, 0, 0, Math.PI * 2)
          ctx.fill()

          // Ice droplets
          ctx.fillStyle = "rgba(77, 166, 255, 0.7)"
          for (let i = 0; i < 3; i++) {
            const dropX = (i - 1) * 8
            const dropY = 5
            ctx.beginPath()
            ctx.arc(dropX, dropY, 2, 0, Math.PI * 2)
            ctx.fill()
          }

          ctx.restore()
        }
      }
    })
  }

  const drawSunOrbs = (ctx: CanvasRenderingContext2D) => {
    const time = Date.now() * 0.005

    sunOrbs.forEach((orb, index) => {
      if (orb.collected) return

      const orbX = orb.x - camera.x
      const orbY = orb.y - camera.y + Math.sin(time + index) * 3

      // Sun orb gradient
      const gradient = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, 12)
      gradient.addColorStop(0, "#FFFF99")
      gradient.addColorStop(0.3, "#FFD700")
      gradient.addColorStop(0.7, "#FFA500")
      gradient.addColorStop(1, "#FF8C00")

      // Main orb body
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(orbX, orbY, 10, 0, Math.PI * 2)
      ctx.fill()

      // Sun rays
      ctx.strokeStyle = "#FFD700"
      ctx.lineWidth = 2
      ctx.lineCap = "round"

      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4 + time
        const rayLength = 6 + Math.sin(time * 2 + i) * 2

        ctx.beginPath()
        ctx.moveTo(orbX + Math.cos(angle) * 12, orbY + Math.sin(angle) * 12)
        ctx.lineTo(orbX + Math.cos(angle) * (12 + rayLength), orbY + Math.sin(angle) * (12 + rayLength))
        ctx.stroke()
      }

      // Inner shine
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
      ctx.beginPath()
      ctx.arc(orbX - 3, orbY - 3, 3, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  const drawUI = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = "#000000"
    ctx.font = "bold 24px Arial"
    ctx.fillText(`Score: ${score}`, 20, 35)

    // Lives below score
    ctx.font = "20px Arial"
    ctx.fillText(`Lives: ${player.lives}`, 20, 65)

    if (gameState === "gameOver") {
      // Game Over screen
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      const gradient = ctx.createLinearGradient(0, CANVAS_HEIGHT / 2 - 100, 0, CANVAS_HEIGHT / 2 + 100)
      gradient.addColorStop(0, "#FF4444")
      gradient.addColorStop(0.5, "#CC0000")
      gradient.addColorStop(1, "#880000")
      ctx.fillStyle = gradient
      ctx.font = "bold 48px Arial"
      ctx.textAlign = "center"
      ctx.fillText("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50)

      ctx.fillStyle = "#FFFFFF"
      ctx.font = "24px Arial"
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
      ctx.fillText(`Lives Lost: ${3 - player.lives}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)

      ctx.fillStyle = "#FFFF00"
      ctx.font = "20px Arial"
      const restartText = "Press R to Restart"
      const textWidth = ctx.measureText(restartText).width
      const pulseScale = 1 + Math.sin(Date.now() * 0.005) * 0.1
      ctx.save()
      ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80)
      ctx.scale(pulseScale, pulseScale)
      ctx.fillText(restartText, -textWidth / 2, 0)
      ctx.restore()

      ctx.textAlign = "left"
    } else if (gameState === "victory") {
      // Victory screen
      ctx.fillStyle = "rgba(0, 100, 0, 0.8)"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      ctx.fillStyle = "#00FF00"
      ctx.font = "bold 48px Arial"
      ctx.textAlign = "center"
      ctx.fillText("VICTORY!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50)

      ctx.fillStyle = "#FFFFFF"
      ctx.font = "24px Arial"
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
      ctx.fillText("Press R to Play Again", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50)
      ctx.textAlign = "left"
    }
  }

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    drawBackground(ctx)
    drawPlatforms(ctx)
    drawIceSpikes(ctx)
    enemies.forEach((enemy) => drawEnemy(ctx, enemy))
    drawProjectiles(ctx)
    drawPlayer(ctx)
    drawSunOrbs(ctx)
    drawUI(ctx)
  }

  const gameLoop = () => {
    updateGame()
    draw()
  }

  useEffect(() => {
    const interval = setInterval(gameLoop, 16)
    return () => clearInterval(interval)
  }, [gameState, player, enemies, projectiles, keys, score])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys((prev) => ({ ...prev, [e.key]: true }))

      if (e.key === "r" || e.key === "R") {
        if (gameState === "gameOver" || gameState === "victory") {
          // Reset game
          setPlayer({
            x: 50,
            y: 300,
            width: 30,
            height: 40,
            velocityX: 0,
            velocityY: 0,
            onGround: false,
            direction: 1,
            isJumping: false,
            shootTimer: 0,
            lives: 3,
            invulnerable: false,
            invulnerabilityTimer: 0,
          })
          setEnemies([
            { x: 500, y: 320, width: 40, height: 30, velocityX: -1, direction: -1 },
            { x: 1200, y: 270, width: 40, height: 30, velocityX: 1, direction: 1 },
            { x: 2000, y: 120, width: 40, height: 30, velocityX: -1, direction: -1 },
            { x: 2800, y: 20, width: 40, height: 30, velocityX: 1, direction: 1 },
            { x: 3600, y: 70, width: 40, height: 30, velocityX: -1, direction: -1 },
            { x: 4400, y: 220, width: 40, height: 30, velocityX: 1, direction: 1 },
            { x: 5200, y: 320, width: 40, height: 30, velocityX: -1, direction: -1 },
          ])
          setProjectiles([])
          setScore(0)
          setGameState("playing")
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys((prev) => ({ ...prev, [e.key]: false }))
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [gameState])

  useEffect(() => {
    // Load background image
    const bgImg = new Image()
    bgImg.onload = () => {
      backgroundImageRef.current = bgImg
    }
    bgImg.src = "/sky-clouds-bg.png"

    // Load cloud platform image
    const cloudImg = new Image()
    cloudImg.onload = () => {
      cloudPlatformImageRef.current = cloudImg
    }
    cloudImg.src = "/cloud-platform.png"

    // Load wide cloud ground image
    const wideCloudImg = new Image()
    wideCloudImg.onload = () => {
      wideCloudGroundImageRef.current = wideCloudImg
    }
    wideCloudImg.src = "/wide-cloud-ground.png"

    const orbs = []
    for (let i = 0; i < 15; i++) {
      orbs.push({
        x: 200 + i * 500 + Math.random() * 200,
        y: 200 + Math.random() * 200,
        collected: false,
      })
    }
    setSunOrbs(orbs)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-400 to-blue-600 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6">
        <h1 className="text-3xl font-bold text-center mb-4 text-blue-800">Gotinha Adventure</h1>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-4 border-blue-300 rounded-lg bg-sky-100"
        />
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Use Arrow Keys or WASD to move • Space to shoot • Avoid enemies and spikes!</p>
          <p>Collect points by defeating smoke enemies • Reach the golden portal to win!</p>
        </div>
      </div>
    </div>
  )
}
