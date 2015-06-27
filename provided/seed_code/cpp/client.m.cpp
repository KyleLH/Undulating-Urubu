#include "galik_socketstream.h"
#include <iostream>
#include <string>
#include <sstream>
#include <time.h>
#include <unistd.h>
#include <cmath>
#include <stdlib.h>

namespace 
{
  const unsigned long long delay = 500000;
  galik::net::socketstream game_socket;
}

void accelerate(int degrees, double power)
{
  std::stringstream command;
  double radians = degrees * M_PI / 180;
  command << "ACCELERATE " << radians << " " << power << std::endl;
  std::cout << command.str() << std::endl;
  game_socket << command.str() << std::endl;
  std::string response;
  std::getline(game_socket, response);
  if (response != "ACCELERATE_OUT DONE") {
    std::cerr << "Accelerate command failed: '" << command.str() << "'" << std::endl;
  }
}

void brake()
{
  std::string command("BRAKE");
  std::cout << command << std::endl;
  game_socket << command << std::endl;
  std::string response;
  std::getline(game_socket, response);
  if (response != "BRAKE_OUT DONE") {
    std::cerr << "Brake command failed: '" << command << "'" << std::endl;
  }
}

void play_interactive()
{
  std::string line;
  while (std::getline(std::cin, line)) {
    game_socket << line.c_str() << std::endl;
    std::string response;
    std::getline(game_socket, response);
    std::cout << response << std::endl;
  }
}

void play_random()
{
  while (true) {
    // 5% of the time, brake;
    // 10% of the time, accelerate randomly;
    // 85% of the time, do nothing.
    int seed = rand() % 100;
    if (seed > 98) {
      brake();
    } else if (seed > 88) {
      int degrees = rand() % 360;
      double power = ((rand() % 500) + 500) / 999.0;
      accelerate(degrees, power);
    }
    usleep(delay);
  }
}

int main(int argc, char** argv) 
{
  if (argc < 5) {
    std::cerr << "Usage: " << argv[0] 
              << " <hostname/ip> <port> <username> <pass> [-i]" << std::endl;
    return 1;
  }

  int port(atoi(argv[2]));
  std::string hostname(argv[1]),
              username(argv[3]), 
              password(argv[4]),
              line;

  bool interactive(argc > 5 ? std::string(argv[5]) == "-i" : false);

  // Open the socket.
  game_socket.open(hostname, port);
  // Login to the server
  game_socket << username << " " << password << std::endl;

  if (interactive) {
    play_interactive();
  } else {
    play_random();
  }

  return 0;
}

