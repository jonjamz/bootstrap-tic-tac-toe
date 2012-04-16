<?php
//-------------------------------------------------
// Verify nonce
session_start();
if($_POST["nnc"] != $_SESSION["nnc"]) die("Outside requests not allowed.");
// Assign command POST variable to simpler one
$command = $_POST["command"];
// An array of errors for easy editing
$errors = array(
  "createGame"  => "Error: couldn't create game!",
  "noGame"      => "Error: game doesn't exist! Redirecting...",
  "dbFail"      => "Failed to connect to MySQL",
  "boardState"  => "Failed to update userState and boardState",
  "userState"   => "Failed to update userState (command = 'request')",
  "switchTurn"  => "Failed to switch turn (command = 'switch')"
);
// Connect to db
$user = "";
$pass = "";
$db = "";
$mysqli = new mysqli(
  "127.0.0.1", 
  $user, 
  $pass, 
  $db
);
// Exit with an error if we can't connect
if ($mysqli->connect_errno) {
  die(json_encode(array("error" => $errors["dbFail"])));
}
//-------------------------------------------------
// Types of requests
//-------------------------------------------------
// Create a new game and return game info
if ($_POST["command"] == "create") {
  // Is dev mode on? Then try to create table
  $dev = true;
  // Schema
  if ($dev === true) {
    $games = "CREATE TABLE IF NOT EXISTS `games` (
      `id` bigint(20) NOT NULL AUTO_INCREMENT, 
      `hash` varchar(255),
      `board_state` varchar(1000),
      `player_1_state` varchar(1000),
      `player_2_state` varchar(1000),
      `winner` varchar(255),
      PRIMARY KEY (`id`))";   
    $mysqli->query($games);
  }
  // Create game
  $put = $mysqli->query("INSERT INTO `games` SET hash = 'temp'");
  $last_id = $mysqli->insert_id;
  $hash = md5($last_id);
  $create = $mysqli->query("UPDATE `games` SET hash = '$hash' WHERE id = '$last_id'");
  if ($create) {
    echo json_encode(array("hash" => $hash));
  } else {
    echo json_encode(array("error" => $errors["noGame"]));
  }
}
//-------------------------------------------------
// Add info to db and pull info out
else if ($command == "update" || $command == "request" || $command == "switch" || $command == "spectate") {
  // Add the required POST variables to simpler ones
  $hash = $_POST["hash"];
  // Establish variables for current user vs. opponent depending on the incoming "type" var
  if ($_POST["userState"]["type"] == 0) {
    $myCol = "player_1_state";
    $oppCol = "player_2_state";
    $myPlayer = 0;
    $oppPlayer = 1;
  }
  else if ($_POST["userState"]["type"] == 1) {
    $myCol = "player_2_state";
    $oppCol = "player_1_state";
    $myPlayer = 1;
    $oppPlayer = 0;
  }
  if ($command == "update" || $command == "switch") {
    // -------------------------
    // Check for wins first, if anything is happening on the board
    if ($_POST["boardState"]) {
      $xs = "";
      $os = "";
      $winner = null;
      // Check for a win
      foreach ($_POST["boardState"] as $k => $v) {
        if ($v == "x") {
          $xs .= $k;
        }
        else if ($v == "o") {
          $os .= $k;
        }
      }
      // Loop through matches and see if the string contains any
      function checkMatches($string, $array_matches) {
        foreach ($array_matches as $matches) {
          $results = "";
          $matches = explode("-", $matches);
          foreach ($matches as $match) {
            if (stripos($string, $match) !== false) {
              $results .= "a";
            }
            else {
              $results .= "b";
            }
          }
          if (stripos($results, "b") === false) {
            return true;
          }
        }
      }
      // Array of possible wins
      $wins = array(
        "1-2-3",
        "4-5-6",
        "7-8-9",
        "1-4-7",
        "2-5-8",
        "3-6-9",
        "1-5-9",
        "3-5-7"
      );
      if (checkMatches($xs, $wins)) {
        $winner = 1;
      }
      if (checkMatches($os, $wins)) {
        $winner = 0;
      }
    }
    // -------------------------
    // Serialize the incoming arrays for storage
    $userState  = serialize($_POST["userState"]);
    $boardState = serialize($_POST["boardState"]);
    // Put current user's userState and boardState in the db
    $update = $mysqli->query("UPDATE `games` SET $myCol = '$userState', board_state = '$boardState', winner = '$winner' WHERE hash = '$hash'");
    if (!$update) die(json_encode(array("error" => $errors["boardState"])));
  }
  // Get all info for this game from the db and unserialize so we can do stuff
  $result = $mysqli->query("SELECT * FROM `games` WHERE hash = '$hash'");
  $all = $result->fetch_assoc();
  $all["board_state"]    = unserialize($all["board_state"]);
  $all["player_1_state"] = unserialize($all["player_1_state"]);
  $all["player_2_state"] = unserialize($all["player_2_state"]);
  // If the command is "switch", switch turns
  if ($command == "switch") {
    $all[$oppCol]["turn"] = "1";
    $all[$myCol]["turn"] = "0";
    $oppState = serialize($all[$oppCol]);
    $update = $mysqli->query("UPDATE `games` SET $oppCol = '$oppState' WHERE hash = '$hash'");
    if (!$update) die(json_encode(array("error" => $errors["switchTurn"])));
  }
  // If it's request, we'll need to favor our existing turn number over the new one
  if ($command == "request" && $_POST["userState"]) {
    // Put only the current user's userState in the db, not boardState
    // this is for when it is not the current user's turn --
    // we don't want the other user's new boardState being overwritten in a loop
    $userStat = $_POST["userState"];
    $userStat["turn"] = $all[$myCol]["turn"];
    $userState = serialize($userStat);
    $update = $mysqli->query("UPDATE `games` SET $myCol = '$userState' WHERE hash = '$hash'");
    if (!$update) die(json_encode(array("error" => $errors["userState"])));
  }
  echo json_encode($all);
}
//-------------------------------------------------
// Check if a game exists and check for existing players
else if ($_POST["command"] == "check") {
  // Add the current game's unique hash to a variable
  $hash = $_POST["hash"];
  // Use said hash to see if the game exists in the db yet
  $check = $mysqli->query("SELECT * FROM `games` WHERE hash = '$hash'");
  if ($check->num_rows > 0) {
    // Check if there is an existing player with a different session_id
    $result = $mysqli->query("SELECT player_1_state, player_2_state FROM `games` WHERE hash = '$hash'");
    $all = $result->fetch_assoc();
    $pl1s = unserialize($all["player_1_state"]);
    $pl2s = unserialize($all["player_2_state"]);
    // $check flags:
    // 0 means no players, 1 means existing player, 2 means both players
    // Have to make sure we avoid duplicating the first player on a refresh
    $check = 0;
    // If player 1's state info exists and the player ID isn't the same as the current requester's
    // then it passes as the second player possibly
    // This will fail on the player ID being the same as the requester's
    // Making 0 flag as "this is the first player"
    if ($all["player_1_state"] != "" && $pl1s["player"] != $_POST["nnc"]) {
      $check = 1;
    }
    // If we passed check 1, the requester isn't the first player
    // So if player 2 state info exists in the db and the requester's ID doesn't match player 2's
    // We know that this is a third player, so we will flag as such and let the front end decide
    // Whether to kick or initiate some kind of spectator view
    // However, if this fails, we know the requester is the second player, so 1 flags as being the
    // second player
    if ($check === 1 && $pl2s["player"] != "" && $pl2s["player"] != $_POST["nnc"]) {
      $check = 2;
    }
    // Generate the response based on $check flag
    $player = "";
    if ($check === 0) {
      $player = "first";
    } else if ($check === 1) {
      $player = "second";
    } else if ($check === 2) {
      $player = "third";
    }
    echo json_encode(array("hash" => $hash, "player" => $player));
  } else {
    echo json_encode(array("error" => $errors["createGame"]));
  }
}

?>