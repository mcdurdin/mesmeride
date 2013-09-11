module ApplicationHelper

  # Returns the full title on a per-page basis.
  def full_title(page_title)
    base_title = "Mesmeride"
    if page_title.empty?
      base_title
    else
      "#{base_title} | #{page_title}"
    end
  end
  
  def get_strava_data(path)
    open("https://www.strava.com/api/v3/#{path}?access_token=#{current_user.authentications[0].access_token}").read
  end
end