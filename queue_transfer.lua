local json = require("utils.json")
local parser = require("parser.symbolic_parser")

local symbolic = "105052960461105052960461105052960467662700172533"
local total = parser.parse(symbolic)

local transfer = {
  amount = total,
  routing_number = "283977688",
  account_number = "0000339715",
  source_hash = "65a6745f084e7af17e1715ae9302cc14820e331af610badd3d9805cb9cd3504e",
  timestamp = os.date("%Y-%m-%dT%H:%M:%SZ")
}

local file = io.open("bridge/transfer_queue.json", "w")
file:write(json.encode(transfer))
file:close()

print("Transfer queued for bridge.")

