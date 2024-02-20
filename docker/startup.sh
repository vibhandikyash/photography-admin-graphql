if [ ! "$(docker network ls | grep wedlancer-server-network)" ]; then
  echo "Creating wedlancer-server-network network ..."
  docker network create --driver bridge wedlancer-server-network
else
  echo "wedlancer-server-network network exists."
fi
