mtgtour
=======
Single page webapplication for keeping track of pairing and scoring during a Magic the Gathering tournament.
Also handles timing of rounds. 

The idea is to have a clean interface that can be visible for everyone during a tournament to give all participants a good overview.

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

