# Scoped rifle ADS simulator
First-person view in a concrete canal; player holds a rifle at the hip and aims down a large green-tinted scope.
Controls: hold Shift/Z/X = aim down sights; arrows/WASD = look. Replay: hip -> aim at 0.84 s -> small scope tilts 1.9-2.8 s -> release at 3.6 s (rifle dips on lowering). Q/E = analog tilt.
Assets: plate.jpg (frame 0 with gun inpainted), gun.png (hip sprite), scope.png (scope frame overlay), scopeview.jpg (scoped interior texture).
Known gaps: no motion blur; plate inpaint visible when zoomed; scoped interior is a fixed texture (panning in scope barely moves it); camera pans in clip only approximated.
