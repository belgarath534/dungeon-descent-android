# Game code

The game's code, split by section from what used to be one big `<script>` in
`index.html`. It is still one page: `index.html` loads these files in number
order when the game starts, and they all share the same global scope, exactly
as the single script did.

Keep the numbers in order when adding a file: a file can only run code at load
time that uses things defined in itself or in a lower-numbered file (functions
called later, from buttons or timers, can live anywhere).

The single-file version is in `backup/`.
