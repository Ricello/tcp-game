# TCP/IP Game Server

## Usage
- `npm install` to install dependencies
- `npm start` to start the server

## Example
``` shell
$ netcat 127.0.0.1 6969
MY_ID
ERR 00 # Not connected
LOGIN name pass
OK
MY_ID
OK
0
LOGIN other one
ERR 02 # Already connected
```

## Supported commands
- `LOGIN name password` - Login
- `MOVE x y` - Move player x,y (= {-1, 0, 1}
- `SCAN`
- `WAIT`
- `TURNS_LEFT`

## Error list
- **ERR 101** - Not connected
- **ERR 102** - Unknown command
- **ERR 103** - Wrong arguments
- **ERR 104** - Command limit reached
- **ERR 105** - Wrong login or password
- **ERR 106** - Already logged in
- **ERR 110** - Invalid move
- **ERR 111** - Already moved this turn
 
## Opis
Każdy gracz steruje robotem znajdującym się w dwuwymiarowym labiryncie. Celem gry jest
znalezienie wyjścia z labiryntu.

## Mechanika gry
Rozgrywka podzielona jest na rundy, które dalej podzielone są na tury. Tura trwa pojedyncze
sekundy, a rundy trwają od kilkudziesięciu do kilku tysięcy tur.
Mapa i pole widzenia są stałe dla konkretnej rundy. Po zakończeniu rundy (patrz: komenda
TURNS_LEFT) zostanie wczytana nowa mapa, a wszyscy gracze przeniesieni na pole startowe.
Podczas jednej tury można wykonać tylko jeden ruch (patrz: komenda MOVE).
Punkty przyznawane są po osiągnięciu pola końcowego. Liczba zdobytych punktów zależy
od liczby pozostałych tur w momencie osiągnięcia celu.

## Komendy
### SCAN
Zwraca opis otoczenia. Liczba zwróconych pól zależy od pola widzenia specyficznego dla
instancji gry. Współrzędne są podane względem pozycji gracza.
W pierwszej linii jest podana liczba pól. W następnych liniach występuje opis każdego z pól:
typ oraz współrzędne. Typy pól to: F - puste pole, S - punkt startowy, E - punkt końcowy, W -
ściana, liczba - inny gracz. Przykład komunikacji:

```
> SCAN
< OK
< 5
< S 0 0
< F 0 1
< F 0 2
< W 0 3
< 2 1 1
```

### MOVE
Komenda MOVE <x> <y> przesuwa gracza o <x> pól w poziomie i o <y> pól w pionie. Po-
prawne są wyłącznie ruchy na pola sąsiednie (tj. mające wspólny bok z bieżącym). Przykład
komunikacji:

```
> MOVE 0 1
< OK
> MOVE 0 1
< ERR 110 invalid move
```

### WAIT
Czeka na następną turę. Na początku kolejnej tury gracz dostanie komunikat OK. Przykład
komunikacji:

```
> WAIT
> OK
podczas rozpoczęcia kolejnej tury
> OK
```

TURNS_LEFT
Zwraca liczbę tur pozostałych do końca rundy. Przykład komunikacji:

```
> TURNS_LEFT
< OK
< 13
```

### Jak połączyć się z serwerem gry przy użyciu mojego ulubionego języka?

C++ - polecamy bibliotekę Asio (tutoriale: [t1](http://www.boost.org/doc/libs/1_51_0/doc/html/boost_asio/tutorial/tutdaytime1.html), [t2](http://www.gamedev.net/blog/950/entry-2249317-a-guide-to-getting-started-with-boostasio/))

Python - wbudowany moduł socket [tutorial](http://www.binarytides.com/python-socket-programming-tutorial/). Dostępny jest również przykładowy [kod do komunikacji.](/examples/tutorial_communication_example.py) 
=======
- `LOGIN name password`- login into the game 
- `MY_ID`- test id getter

## Error list
- `ERR 00` - Not connected
- `ERR 01` - Command not supported

### Login
- `ERR 02` - Wrong login or password
- `ERR 03` - Already logged in
