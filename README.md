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