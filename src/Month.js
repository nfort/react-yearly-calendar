import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { momentObj } from 'react-moment-proptypes';
import Day from './Day';
import { range } from './utils';

const propTypes = {
  year: PropTypes.number.isRequired,
  month: PropTypes.number.isRequired,
  forceFullWeeks: PropTypes.bool.isRequired,
  showWeekSeparators: PropTypes.bool.isRequired,
  selectedDays: PropTypes.arrayOf(momentObj).isRequired,
  firstDayOfWeek: PropTypes.number.isRequired,
  selectingRange: PropTypes.arrayOf(momentObj),
  selectRange: PropTypes.bool.isRequired,
  selectedRange: momentObj,
  customClasses: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  dayClicked: PropTypes.func.isRequired,
  dayHovered: PropTypes.func.isRequired
};

const defaultProps = {
  selectingRange: undefined,
  selectedRange: undefined,
  customClasses: undefined
};

class Month extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.selectingRange !== undefined) {
      this.setState({
        selectingRangeStart: nextProps.selectingRange[0].month(),
        selectingRangeEnd: nextProps.selectingRange[1].month()
      });
    }
  }

  shouldComponentUpdate(nextProps) {
    const { month, selectingRange, selectedRange } = this.props;
    const { selectingRangeStart, selectingRangeEnd } = this.state;

    // full repaint for some global-affecting rendering props
    if (
      this.props.year !== nextProps.year ||
      this.props.forceFullWeeks !== nextProps.forceFullWeeks ||
      this.props.showWeekSeparators !== nextProps.showWeekSeparators ||
      this.props.firstDayOfWeek !== nextProps.firstDayOfWeek ||
      this.props.selectRange !== nextProps.selectRange ||
      this.props.customClasses !== nextProps.customClasses ||
      (this.props.selectRange && selectingRange === undefined && nextProps.selectingRange === undefined)
    ) {
      return true;
    }

    // if we get to this point and we are in 'selectRange' mode then it's likely that we have a change in selectingRange
    if (this.props.selectRange) {
      if (selectingRange === undefined) {
        let oldRangeStart = selectedRange[0].month();
        let oldRangeEnd = selectedRange[1].month();
        if (oldRangeStart > oldRangeEnd) {
          [oldRangeStart, oldRangeEnd] = [oldRangeEnd, oldRangeStart];
        }

        let newRangeStart = nextProps.selectingRange[0].month();
        let newRangeEnd = nextProps.selectingRange[1].month();
        if (newRangeStart > newRangeEnd) {
          [newRangeStart, newRangeEnd] = [newRangeEnd, newRangeStart];
        }

        // first time it's called, repaint months in old selectedRange and next selectingRange
        return (oldRangeStart <= month && month <= oldRangeEnd) || (newRangeStart <= month && month <= newRangeEnd);
      } else if (nextProps.selectingRange === undefined) {
        // last time it's called, repaint months in previous selectingRange
        let oldRangeStart = selectingRangeStart;
        let oldRangeEnd = selectingRangeEnd;
        if (oldRangeStart > oldRangeEnd) {
          [oldRangeStart, oldRangeEnd] = [oldRangeEnd, oldRangeStart];
        }

        let newRangeStart = nextProps.selectedRange[0].month();
        let newRangeEnd = nextProps.selectedRange[1].month();
        if (newRangeStart > newRangeEnd) {
          [newRangeStart, newRangeEnd] = [newRangeEnd, newRangeStart];
        }

        // called on day hovering changed
        return (oldRangeStart <= month && month <= oldRangeEnd) || (newRangeStart <= month && month <= newRangeEnd);
      }
      // called on day hovering changed
      let oldRangeStart = selectingRangeStart;
      let oldRangeEnd = selectingRangeEnd;
      if (oldRangeStart > oldRangeEnd) [oldRangeStart, oldRangeEnd] = [oldRangeEnd, oldRangeStart];

      let newRangeStart = nextProps.selectingRange[0].month();
      let newRangeEnd = nextProps.selectingRange[1].month();
      if (newRangeStart > newRangeEnd) {
        [newRangeStart, newRangeEnd] = [newRangeEnd, newRangeStart];
      }

      return (oldRangeStart <= month && month <= oldRangeEnd) || (newRangeStart <= month && month <= newRangeEnd);
    } else if (
      this.props.selectedDays.some(day => day.month() === month) ||
      nextProps.selectedDays.some(day => day.month() === month)
    ) {
      // single selectedDays changed: repaint months where selectedDays was and where will be
      return true;
    }

    return false;
  }

  dayClicked(day, classes) {
    const { dayClicked } = this.props;
    dayClicked(day, classes);
  }

  dayHovered(day) {
    const { selectRange, dayHovered } = this.props;
    if (selectRange) {
      dayHovered(day);
    }
  }

  renderMonthDays() {
    const {
      year,
      month,
      forceFullWeeks,
      showWeekSeparators,
      selectedDays,
      firstDayOfWeek,
      selectingRange,
      selectRange,
      selectedRange,
      customClasses
    } = this.props;
    const monthStart = moment([year, month, 1]); // current day

    // number of days to insert before the first of the month to correctly align the weekdays
    let prevMonthDaysCount = monthStart.weekday();
    while (prevMonthDaysCount < firstDayOfWeek) {
      prevMonthDaysCount += 7;
    }
    // days in month
    const numberOfDays = monthStart.daysInMonth();
    // insert days at the end to match up 37 (max number of days in a month + 6)
    // or 42 (if user prefers seeing the week closing with Sunday)
    const totalDays = forceFullWeeks ? 42 : 37;

    // day-generating loop
    const days = [];
    range(firstDayOfWeek + 1, totalDays + firstDayOfWeek + 1).forEach(i => {
      const day = moment([year, month, i - prevMonthDaysCount]);

      // pick appropriate classes
      const classes = [];
      if (i <= prevMonthDaysCount) {
        classes.push('prev-month');
      } else if (i > numberOfDays + prevMonthDaysCount) {
        classes.push('next-month');
      } else {
        if (selectRange) {
          // selectingRange is used while user is selecting a range
          // (has clicked on start day, and is hovering end day - but not yet clicked)
          let start = (selectingRange || selectedRange)[0];
          let end = (selectingRange || selectedRange)[1];

          // validate range
          if (end.isBefore(start)) {
            [end, start] = selectingRange || selectedRange;
          }

          if (day.isBetween(start, end, 'day', '[]')) {
            classes.push('range');
          }

          if (day.isSame(start, 'day')) {
            classes.push('range-left');
          }

          if (day.isSame(end, 'day')) {
            classes.push('range-right');
          }
        } else if (selectedDays.some(currentDay => day.isSame(currentDay, 'day'))) {
          classes.push('selected');
        }

        // call here customClasses function to avoid giving improper classes to prev/next month
        if (customClasses instanceof Function) {
          classes.push(customClasses(day));
        }
      }

      if ((i - 1) % 7 === 0) {
        // sunday
        classes.push('bolder');
      }

      if (customClasses) {
        Object.keys(customClasses).forEach(k => {
          const obj = customClasses[k];
          // Order here is important! Everything is instance of Object in js
          if (typeof obj === 'string') {
            if (obj.indexOf(day.format('ddd')) > -1) {
              classes.push(k);
            }
          } else if (obj instanceof Array) {
            obj.forEach(d => {
              if (day.format('YYYY-MM-DD') === d) classes.push(k);
            });
          } else if (obj instanceof Function) {
            if (obj(day)) {
              classes.push(k);
            }
          } else if (obj.start && obj.end) {
            const startDate = moment(obj.start, 'YYYY-MM-DD').add(-1, 'days');
            const endDate = moment(obj.end, 'YYYY-MM-DD').add(1, 'days');
            if (day.isBetween(startDate, endDate)) {
              classes.push(k);
            }
          }
        });
      }

      if (showWeekSeparators) {
        if ((i - 1) % 7 === firstDayOfWeek && days.length) {
          // push week separator
          days.push(<td className="week-separator" key={`seperator-${i}`} />);
        }
      }
      days.push(
        <Day
          key={`day-${i}`}
          day={day.isValid() ? day : null}
          classes={classes.join(' ')}
          dayClicked={d => this.dayClicked(d, classes.join(' '))}
          dayHovered={d => this.dayHovered(d)}
        />
      );
    });

    return days;
  }

  render() {
    const { month, year } = this.props;

    return (
      <tr>
        <td className="month-name">{moment([year, month, 1]).format('MMM')}</td>
        {this.renderMonthDays()}
      </tr>
    );
  }
}

Month.propTypes = propTypes;
Month.defaultProps = defaultProps;

export default Month;
