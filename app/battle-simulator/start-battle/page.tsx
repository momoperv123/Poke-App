// /battle-simulator/start-battle/page.tsx

"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { Move, Pokemon } from "../types";
import { usePokemonTeam } from "../PokemonTeamContext";
import Navbar from "@/app/Navbar";
import Background from "@/app/public/images/battle.png";

export default function StartBattlePage() {
  const { playerTeam, opponentTeam } = usePokemonTeam();

  const [currentPlayerTeam, setCurrentPlayerTeam] = useState<Pokemon[]>([]);
  const [currentOpponentTeam, setCurrentOpponentTeam] = useState<Pokemon[]>([]);
  const [playerPokemon, setPlayerPokemon] = useState<Pokemon | null>(null);
  const [opponentPokemon, setOpponentPokemon] = useState<Pokemon | null>(null);

  const [playerHP, setPlayerHP] = useState<number>(0);
  const [opponentHP, setOpponentHP] = useState<number>(0);

  const [battleText, setBattleText] = useState("A wild battle has begun!");
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const [moveLog, setMoveLog] = useState<string[]>([]);
  const [showEndOverlay, setShowEndOverlay] = useState(false);
  const [endMessage, setEndMessage] = useState("");

  useEffect(() => {
    if (playerTeam && playerTeam.length > 0) {
      setCurrentPlayerTeam([...playerTeam]);
      setPlayerPokemon(playerTeam[0]);
      setPlayerHP(playerTeam[0]?.stats?.hp ?? 0);
    }
    if (opponentTeam && opponentTeam.length > 0) {
      setCurrentOpponentTeam([...opponentTeam]);
      setOpponentPokemon(opponentTeam[0]);
      setOpponentHP(opponentTeam[0]?.stats?.hp ?? 0);
    }
  }, [playerTeam, opponentTeam]);

  useEffect(() => {
    if (playerHP <= 0 && playerPokemon) {
      handlePlayerFaint();
    } else if (opponentHP <= 0 && opponentPokemon) {
      handleOpponentFaint();
    }
  }, [playerHP, opponentHP]);

  const handleMoveSelect = (move: Move) => {
    if (
      isPlayerTurn &&
      playerPokemon &&
      opponentPokemon &&
      playerHP > 0 &&
      opponentHP > 0
    ) {
      const damage = calculateDamage(move, playerPokemon, opponentPokemon);

      if (!isNaN(damage)) {
        setOpponentHP((prevHP) => Math.max(prevHP - damage, 0));

        const logEntry = `${playerPokemon.name} uses ${move.name} for ${damage} points of damage on ${opponentPokemon.name}`;
        setMoveLog((prevLog) => [...prevLog, logEntry]);
        setBattleText(logEntry);
      } else {
        const logEntry = `${playerPokemon.name} missed the move!`;
        setMoveLog((prevLog) => [...prevLog, logEntry]);
        setBattleText(logEntry);
      }

      setIsPlayerTurn(false);

      setTimeout(() => {
        if ((opponentHP ?? 0) - damage <= 0) {
          handleOpponentFaint();
        } else {
          handleOpponentTurn();
        }
      }, 2000);
    }
  };

  const handleSwitchPokemon = (pokemon: Pokemon) => {
    if (pokemon !== playerPokemon && playerPokemon) {
      // Save the current HP of the Pokémon being switched out
      setCurrentPlayerTeam((prevTeam) =>
        prevTeam.map((p) =>
          p === playerPokemon
            ? { ...p, stats: { ...p.stats, hp: playerHP } }
            : p
        )
      );

      // Switch to the new Pokémon and set its HP
      setPlayerPokemon(pokemon);
      setPlayerHP(pokemon.stats.hp);

      const logEntry = `${playerPokemon.name} switched to ${pokemon.name}`;
      setMoveLog((prevLog) => [...prevLog, logEntry]);
      setBattleText(`${pokemon.name}, I choose you!`);
      setShowSwitchMenu(false);
      setIsPlayerTurn(false);

      setTimeout(() => {
        handleOpponentTurn();
      }, 2000);
    }
  };

  const handlePlayerFaint = () => {
    if (playerHP > 0 || !playerPokemon) return;

    const logEntry = `${playerPokemon.name} fainted!`;
    setMoveLog((prevLog) => [...prevLog, logEntry]);
    setBattleText(logEntry);

    const remainingPlayerTeam = currentPlayerTeam.filter(
      (p) => p !== playerPokemon
    );

    setCurrentPlayerTeam(remainingPlayerTeam);

    if (remainingPlayerTeam.length > 0) {
      const nextPokemon = remainingPlayerTeam[0];
      setTimeout(() => {
        setPlayerPokemon(nextPokemon);
        setPlayerHP(nextPokemon.stats.hp);
        setBattleText(`${nextPokemon.name}, I choose you!`);
      }, 2000);
    } else {
      setEndMessage("You have no more Pokémon! You blacked out!");
      setShowEndOverlay(true);
    }
  };

  const handleOpponentFaint = () => {
    if (opponentHP > 0 || !opponentPokemon) return;

    const logEntry = `${opponentPokemon.name} fainted!`;
    setMoveLog((prevLog) => [...prevLog, logEntry]);
    setBattleText(logEntry);

    const remainingOpponentTeam = currentOpponentTeam.filter(
      (p) => p !== opponentPokemon
    );

    setCurrentOpponentTeam(remainingOpponentTeam);

    if (remainingOpponentTeam.length > 0) {
      const nextPokemon = remainingOpponentTeam[0];
      setTimeout(() => {
        setOpponentPokemon(nextPokemon);
        setOpponentHP(nextPokemon.stats.hp);
        setBattleText(`Opponent sent out ${nextPokemon.name}!`);
        setIsPlayerTurn(true);
      }, 2000);
    } else {
      setEndMessage("You won the battle!");
      setShowEndOverlay(true);
    }
  };

  const handleOpponentTurn = () => {
    if (!opponentPokemon || !playerPokemon) return;

    const move = selectAIMove();
    const damage = calculateDamage(move, opponentPokemon, playerPokemon);

    if (!isNaN(damage)) {
      setPlayerHP((prevHP) => Math.max(prevHP - damage, 0));
      const logEntry = `${opponentPokemon.name} uses ${move.name} for ${damage} points of damage on ${playerPokemon.name}`;
      setMoveLog((prevLog) => [...prevLog, logEntry]);
      setBattleText(logEntry);
    } else {
      const logEntry = `${opponentPokemon.name} missed the move!`;
      setMoveLog((prevLog) => [...prevLog, logEntry]);
      setBattleText(logEntry);
    }
    setIsPlayerTurn(true);

    if (playerHP - damage <= 0) {
      setTimeout(() => {
        handlePlayerFaint();
      }, 2000);
    }
  };

  const selectAIMove = (): Move => {
    if (
      opponentPokemon &&
      opponentPokemon.selectedMoves &&
      opponentPokemon.selectedMoves.length > 0
    ) {
      const randomIndex = Math.floor(
        Math.random() * opponentPokemon.selectedMoves.length
      );
      return opponentPokemon.selectedMoves[randomIndex];
    }
    // Default move if no moves are available
    return {
      name: "Struggle",
      power: 50,
      type: "physical",
    };
  };

  const calculateDamage = (
    move: Move,
    attacker: Pokemon,
    defender: Pokemon
  ): number => {
    const attackStat =
      move.type === "special"
        ? attacker.stats.specialAttack
        : attacker.stats.attack;
    const defenseStat =
      move.type === "special"
        ? defender.stats.specialDefense
        : defender.stats.defense;

    const movePower =
      typeof move.power === "string" ? parseInt(move.power, 10) : move.power;

    const baseDamage =
      (((2 * attacker.level) / 5 + 2) *
        movePower *
        (attackStat / defenseStat)) /
        50 +
      2;

    return isNaN(baseDamage) ? NaN : Math.round(baseDamage);
  };

  const selectNewTeam = () => {
    window.location.href = "/battle-simulator/player-team-selection";
  };

  if (!playerPokemon || !opponentPokemon) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-white text-xl">Loading battle...</p>
      </div>
    );
  }

  // Add this function before your return statement
  const getHPBarColor = (hp, maxHp) => {
    const hpPercentage = (hp / maxHp) * 100;
    if (hpPercentage > 50) return "bg-green-500";
    if (hpPercentage > 20) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div
      className="bg-cover bg-center min-h-screen text-xs text-white"
      style={{ backgroundImage: `url(${Background.src})` }}
    >
      <Navbar />
      <div className="flex justify-center items-start py-16">
        <div className="flex w-full max-w-7xl mt-16 flex-col md:flex-row">
          <div className="bg-gray-800 opacity-75 p-4 rounded-lg shadow-lg w-full md:w-1/4 md:mr-4 overflow-y-scroll">
            <h2 className="text-lg font-semibold mb-2">Move Log</h2>
            <div className="h-96">
              {moveLog.map((logEntry, index) => (
                <p key={index} className="text-sm">
                  {logEntry}
                  <br />
                  <br />
                </p>
              ))}
            </div>
          </div>

          {/* Updated Battle Area */}
          <div className="bg-gray-800 bg-opacity-50 p-8 rounded-lg shadow-lg w-full md:w-3/4">
            <div className="flex justify-between items-start mb-8 flex-col md:flex-row">
              {/* Player's Pokémon */}
              <div className="text-center w-full md:w-1/2 mb-4 md:mb-0">
                <h3 className="text-green-500 text-lg font-semibold mb-2">
                  You
                </h3>
                {playerPokemon && (
                  <>
                    <img
                      src={playerPokemon.sprites.front_default}
                      alt={playerPokemon.name}
                      className="w-36 h-36 mx-auto"
                      loading="lazy"
                    />
                    <div className="font-bold text-xl mt-2">
                      {playerPokemon.name} (Lv {playerPokemon.level})
                    </div>
                    <div className="text-sm">
                      HP: {playerHP}/{playerPokemon.stats.hp}
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded mt-1">
                      <div
                        className={`h-2 rounded ${getHPBarColor(
                          playerHP,
                          playerPokemon.stats.hp
                        )}`}
                        style={{
                          width: `${
                            (playerHP / playerPokemon.stats.hp) * 100
                          }%`,
                          transition: "width 0.5s ease-in-out",
                        }}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Opponent's Pokémon */}
              <div className="text-center w-full md:w-1/2 mb-4 md:mb-0">
                <h3 className="text-red-500 text-lg font-semibold mb-2">
                  Opponent
                </h3>
                {opponentPokemon && (
                  <>
                    <img
                      src={opponentPokemon.sprites.front_default}
                      alt={opponentPokemon.name}
                      className="w-36 h-36 mx-auto"
                      loading="lazy"
                    />
                    <div className="font-bold text-xl mt-2">
                      {opponentPokemon.name} (Lv {opponentPokemon.level})
                    </div>
                    <div className="text-sm">
                      HP: {opponentHP}/{opponentPokemon.stats.hp}
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded mt-1">
                      <div
                        className={`h-2 rounded ${getHPBarColor(
                          opponentHP,
                          opponentPokemon.stats.hp
                        )}`}
                        style={{
                          width: `${
                            (opponentHP / opponentPokemon.stats.hp) * 100
                          }%`,
                          transition: "width 0.5s ease-in-out",
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-black bg-opacity-60 p-4 rounded-lg text-center mb-4">
              <p className="text-lg font-semibold">{battleText}</p>
            </div>

            {isPlayerTurn && !showSwitchMenu && (
              <div className="grid grid-cols-2 gap-4">
                {playerPokemon &&
                  playerPokemon.selectedMoves &&
                  playerPokemon.selectedMoves.map((move, index) => (
                    <button
                      key={index}
                      onClick={() => handleMoveSelect(move)}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 transform hover:scale-105 transition-transform duration-150"
                      aria-label={`Select move ${move.name}`}
                    >
                      {move.name}
                    </button>
                  ))}
                <button
                  onClick={() => setShowSwitchMenu(true)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded col-span-2 focus:outline-none focus:ring-2 focus:ring-yellow-300 transform hover:scale-105 transition-transform duration-150"
                >
                  Switch Pokémon
                </button>
              </div>
            )}

            {showSwitchMenu && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {currentPlayerTeam.map((pokemon, index) => (
                  <button
                    key={index}
                    onClick={() => handleSwitchPokemon(pokemon)}
                    className={`text-white font-bold py-3 px-6 rounded ${
                      pokemon === playerPokemon
                        ? "bg-green-500 opacity-50 cursor-not-allowed"
                        : "bg-green-500 hover:bg-green-600 transform hover:scale-105 transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-green-300"
                    }`}
                    disabled={pokemon === playerPokemon}
                    aria-disabled={pokemon === playerPokemon ? "true" : "false"}
                  >
                    {pokemon.name} (HP: {pokemon.stats.hp})
                  </button>
                ))}
                <button
                  onClick={() => setShowSwitchMenu(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded w-full col-span-2 focus:outline-none focus:ring-2 focus:ring-gray-300 transform hover:scale-105 transition-transform duration-150"
                >
                  Back
                </button>
              </div>
            )}

            {!isPlayerTurn && (
              <div className="flex items-center justify-center mt-4">
                <p className="text-white">Opponent is choosing a move...</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {showEndOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold text-white mb-4">{endMessage}</h2>
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={selectNewTeam}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded focus:outline-none focus:ring-2 focus:ring-green-300 transform hover:scale-105 transition-transform duration-150"
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
