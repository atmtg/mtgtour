mtgtour
=======
Single page webapplication for keeping track of pairing and scoring during a Magic the Gathering tournament.
Also handles timing of rounds. 

The idea is to have a clean interface that can be visible for everyone during a tournament to give all participants a good overview.

1.7.0
----
	* Added possibility to play different number of rounds than three. The number can be changed with buttons after pairing for first round.
	* Workaround for the known issue below. When more than eight players are entered the old player listing will appear instead of the oval table. 

1.6.0
-----
	* Fixed bug with pairing when uneven number of players. Now byes work again.
	* Reset tournament button now always visible in bottom left.
	* Audible feedback: Ten minute warning, three minute warning and TIME.
	* Players are seated at an oval draft table before pairing for first round.

	* KNOWN ISSUE: Adding more players than eight will cause crash!

1.5.0
-----
	* Fixed the pairing-bug again. Data in tests where not correct, causing tests to pass without code being correct.
        * Revamped GUI with new background, different table color, and version number on screen
        * Added 'Start new tournament' button to screen when entering players. Makes it easier to reset if reloading with old tournament.

1.4.0
-----
        * Fixed further slow dows connected to the timer
        * Fixed a bug in pairing causing players to be paired again at
        some times.

1.3.0
-----
        * Fixed a bug that caused the application to slow down when
        the timer had been running for a while.
        * Renamed buttons for registering results for player 2. Users
        had problems understanding how to register results correctly.

