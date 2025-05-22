import pygame
from noise import snoise2
from math import sqrt

pygame.init()

res = 1024
mid = res>>1
surf = pygame.Surface((res, res), pygame.SRCALPHA)

clamp = lambda x: 0 if x < 0 else 1 if x > 1 else x
sqr = lambda x: x*x
gradient = lambda a, b, t: clamp((t-a) / (b-a))
div = 1 / (mid * sqrt(2))

for x in range(res):
    for y in range(res):
        # euclidian
        dist1 = sqrt(sqr(x-mid) + sqr(y-mid)) * div
        # manhattan
        dist2 = sqr(max(abs(x-mid), abs(y-mid)) / mid)
        dist = (dist1+dist2) / 2

        noise = (snoise2(x*.015, y*.015)+1) / 2
        circle = gradient(.4, .7, dist)
        value = noise > circle
        value = clamp(value)*255

        surf.set_at((x, y), (0, 0, 0, value))

pygame.image.save(surf, 'noise.png')
