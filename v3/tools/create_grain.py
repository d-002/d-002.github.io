import pygame
from random import randint

pygame.init()

res = 1024
surf = pygame.Surface((res, res))

for x in range(res):
    for y in range(res):
        light = randint(0, 255)
        surf.set_at((x, y), (light, light, light))

pygame.image.save(surf, 'grain.png')
