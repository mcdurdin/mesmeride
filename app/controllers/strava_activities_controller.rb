class StravaActivitiesController < ApplicationController
  before_action :signed_in_user

  include ApplicationHelper

  def create
    require 'open-uri'
    require 'json'
    
    strava_activity = params[:strava_activity]
    
    segment_id_match = /^http(s)?\:\/\/(www|app)\.strava\.com\/segments\/(\d+)$/.match(strava_activity[:activity_id])
    effort_id_match = /^http(s)?\:\/\/(www|app)\.strava\.com\/activities\/(\d+)\#(\d+)$/.match(strava_activity[:activity_id])
    activity_id_match = /^http(s)?\:\/\/(www|app)\.strava\.com\/activities\/(\d+)$/.match(strava_activity[:activity_id]) || /^()(\d+)$/.match(strava_activity[:activity_id])

    if activity_id_match.nil? && segment_id_match.nil? && effort_id_match.nil?
      redirect_to get_activity_url, notice: "Invalid Activity ID or URL"
    end
    
    effort_id = nil
    
    if !segment_id_match.nil?
      effort_activity = import_strava_segment_and_get_first_activity(segment_id_match[3])
      if effort_activity.nil?
        redirect_to get_activity_url, notice: "Invalid Segment"
      end
      
      effort_id = effort_activity[:effort]
      activity_id = effort_activity[:activity]
      
    elsif !effort_id_match.nil?
      activity_id = effort_id_match[3]
      effort_id = effort_id_match[4]
    else # !activity_id_match.nil?
      activity_id = activity_id_match.nil? ? strava_activity[:activity_id] : activity_id_match[3]
    end
    
    import_strava_activity(activity_id)
        
    redirect_to new_route_url(:activity_id => activity_id, :effort_id => effort_id)
  end

  def new
    @strava_activity = StravaActivity.new
    @activities = JSON.parse(get_strava_data('activities'))
  end
  
private

  def import_strava_segment_and_get_first_activity(segment_id)
    leaderboard = JSON.parse(get_strava_data("segments/#{segment_id}/leaderboard"))
    if leaderboard['entries'].length > 0
      {:activity => leaderboard['entries'][0]['activity_id'], :effort => leaderboard['entries'][0]['effort_id']}
    else
      nil
    end
  end
  
  def import_strava_activity(activity_id)
    @strava_activity = StravaActivity.find_by_activity_id(activity_id)
    if @strava_activity.nil?
      activity_json = get_strava_data("activities/#{activity_id}")
      stream_json = get_strava_data("activities/#{activity_id}/streams/time,distance,altitude,grade_smooth") #?resolution=high")
      # todo : failure test
      # result = JSON.parse(result_json)
      
      raw_data = {:activity => JSON.parse(activity_json), :streams => JSON.parse(stream_json)}.to_json
              
      @strava_activity = StravaActivity.new :activity_id => activity_id, :raw_data => raw_data
      @strava_activity.name = @strava_activity.data["activity"]["name"]
      @strava_activity.save
    end
  end

    def signed_in_user
      redirect_to root_url, notice: "Please sign in." unless signed_in?
    end
end
