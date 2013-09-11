class StravaActivitiesController < ApplicationController

  include ApplicationHelper

  def create
    require 'open-uri'
    require 'json'
    
    strava_activity = params[:strava_activity]
    activity_id = strava_activity[:activity_id]
    
    @strava_activity = StravaActivity.find_by_activity_id(activity_id)
    if @strava_activity.nil?
        result_json = get_strava_data("activities/#{activity_id}")
        # todo : failure test
        result = JSON.parse(result_json)    
        @strava_activity = StravaActivity.create :name => result["name"], :activity_id => activity_id, :raw_data => result_json
    end
    
    redirect_to routes_new_url(:activity_id => activity_id)
  end

  def new
    @strava_activity = StravaActivity.new
  end
end
