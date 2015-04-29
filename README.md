Developer Console
---------------
Running in dev mode is now the default behavior (run: node app.js). In dev mode, Peggy provides an HTML-based simulator for the LiteBrite. You can access this in your browser at /peggy/dev. To run the server in live mode (i.e. to connect to the LiteBrite directly), run: node app.js live.

API
---------------
There are two routes to the API. They respond to any HTTP verb. All example query paramaters are required.
```
	/peggy/write/
	e.g. /peggy/write?board=1&x=0&y0&text=hello%20world
```
To change the colors in the text add either {r} for red {o} for orange or {g} for green. All subsequent characters will be that color. You can use multiple colors in the the text param. E.g. "{o}Hello {r}World{g}!" will have "Hello" in red "World" in Orange and "!" in green.

```
	/peggy/clear
	e.g. /peggy/clear?board=1
```

Modules 
---------------
Any .js files in the modules subdirectory will be forked and executed immediately. Scripts there are responsible for keeping themselves alive.

----------------
Boards are in the following order 
```
	0 1 4
	2 3 5
```
Boards 0-3 have 80 columns and 12 rows each.
Boards 4 and 5 have 32 columns and 12 rows.
A request that extends a write request beyond a board will probably, maybe fail.
