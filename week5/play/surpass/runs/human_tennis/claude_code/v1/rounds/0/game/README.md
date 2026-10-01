# Tennis rally simulator
Static broadcast camera; near (purple) player controlled, far player AI, ball with gravity+bounce in screen space (ground point + height).
Controls: arrows/WASD move, Space swing (hits the ball if it has bounced and is within reach).
Sprites cut from the video (near: every 2nd frame, far: frames 0-226), played by velocity-matched sequence playback; swing clips around measured contacts.
Known gaps: background is the median plate; ball shadow/scale approximate; far player sprites have small edge artifacts; final near return (frame ~340) misses in replay.
