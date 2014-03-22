API
---------------
There are two routes to the API. They respond to any HTTP verb. All example query paramaters are required.
```
	/peggy/write/
	e.g. /peggy/write?board=1&x=0&y0&text=hello%20world
```
To change the colors in the text add either {#0} for red {#1} for orange or {#2} for green. All subsequent characters will be that color. You can use multiple colors in the the text param. E.g. "{#1}Hello {#0}World{#2}!" will have "Hello" in red "World" in Orange and "!" in green.

```
	/peggy/clear
	e.g. /peggy/clear?board=1
```

Modules 
---------------
Any .js files in the modules subdirectory will be executed automatically by calling their execute function. Each module is responsible for keeping itself running by calling setTimeout or another method.

Boards
----------------
Boards are in the following order 
```
	0 1 4
	2 3 5
```
Boards 0-3 have 80 columns and 12 rows each.
Boards 4 and 5 have 32 columns and 12 rows.
A request that extends a write request beyond a board will probably, maybe fail.