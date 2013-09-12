class StravaActivitiesController < ApplicationController

  include ApplicationHelper

  def create
    require 'open-uri'
    require 'json'
    
    strava_activity = params[:strava_activity]
    activity_id = strava_activity[:activity_id]
    
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
    
    redirect_to new_route_url(:activity_id => activity_id)
  end

  def new
    @strava_activity = StravaActivity.new
  end
end
