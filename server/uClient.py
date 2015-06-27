#!/usr/bin/env python

import socket, sys, re, math
from time import sleep

####################
# Global Variables #
####################

CONFIGURATION_INFO = {}

#######################
# Main Control Method #
#######################

def main(sock):
	CONFIGURATION_INFO = configurations(sock)

	mines = mapBoard(sock)

##################
# Action Methods #
##################

def mapBoard(sock):
	diameter = CONFIGURATION_INFO.scanRadius * 2
	angle = math.atan(diameter/CONFIGURATION_INFO.mapWidth)

	accel(sock, angel, 1)

	return None

#################
# Game Commands #
#################

# TODO: Parse the status string into a dict or something
def status(sock):
    statusInfo = run(sock, 'STATUS')

    return statusInfo

# angle is radians 
# magnitude is 0-1
def accel(sock, angle, magnitude):
    cmd = 'ACCELERATE %f %f' % (angle, magnitude)
    run(sock, cmd)

def brake(sock):
    run(sock, 'BRAKE')

def bomb(sock, x, y, t=None):
	if t:
		cmd = 'BOMB %f %f' % (x, y)
	else:
		cmd = 'BOMB %f %f %d' % (x, y, t)

	run(sock, cmd)

# TODO: Parse scanInfo
def scan(sock, x, y):
	cmd = 'SCAN %f %f' % (x, y)
	scanInfo = run(sock, cmd)

	return scanInfo

# TODO: Parse scoreInfo
def scoreboard(sock):
	scoreInfo = run(sock, 'SCOREBOARD')

	return scoreInfo

def configurations(sock):
	configurationInfo = run(sock, 'CONFIGURATIONS')

	parsedConfigurations = re.findall(r'\s\d+\s', configurationInfo)

	return {
		mapWidth: parsedConfigurations[0],
		mapHeight: parsedConfigurations[1],
		captureRadius: parsedConfigurations[2],
		visionRadius: parsedConfigurations[3],
		friction: parsedConfigurations[4],
		brakeFriction: parsedConfigurations[5],
		bombPlaceRadius: parsedConfigurations[6],
		bombEffectRadius: parsedConfigurations[7],
		bombDelay: parsedConfigurations[8],
		bombPower: parsedConfigurations[9],
		scanRadius: parsedConfigurations[10],
		scanDelay: parsedConfigurations[11]
	}

##################
# Helper Methods #
##################

def run(sock, command):
    try:
        sock.sendall(command + '\n')
        sfile = sock.makefile()
        ret = sfile.readline()
        return ret
    except socket.error as msg:
        print 'Could not run command "'+command+'": '+str(msg)

def login(host, port, username, password):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.connect((host, int(port)))
        sock.sendall(username+' '+password+'\n')
        return sock
    except socket.error as msg:
        print 'Could not create socket: ' + str(msg)

##########
# Set Up #
##########

if __name__ == '__main__':
    if (len(sys.argv) !=  5):
      print 'Usage: ' + sys.argv[0] + ' <host> <port> <username> <pass>'
      sys.exit(1)

    host = sys.argv[1]
    port = sys.argv[2]
    username = sys.argv[3]
    password = sys.argv[4]
    sock = login(host, port, username, password)
    
    main(sock)