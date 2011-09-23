$(function() {

  superagent.get("/scores/leaderboard", function(result) {
    $("#leaderboard").empty()
    _(result.body.leaderboard).each(function(leader, rank) {
      $("#leaderboard").append(
        $("#player-in-leaderboard").children().clone()
          .find(".rank").text(rank+1).end()
          .find(".player_name").text(leader.player.toUpperCase()).end()
          .find(".player_scores").text(leader.score).end()
      )
    })
  })

})
