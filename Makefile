
community-img:
	node ./AAA/01/index.js
	node ./AAA/02/index.js
	node ./AAA/03/index.js
	node ./AAA/04/index.js
	node ./AAA/05/index.js

detection:
	node ./AAB/index.js > ./AAB/results/scores.txt
	node ./AAB/find.js
